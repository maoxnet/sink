<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { today, getLocalTimeZone } from '@internationalized/date'
import { CalendarIcon, CheckCircle, ClipboardPaste, Copy, Loader2, RefreshCw, RotateCcw, XCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { cn } from '@/lib/utils'

const { t, locale } = useI18n()

interface BatchConvertResponse {
  result: string
  converted: number
  total: number
  created: number
  failed: number
}

const inputText = ref('')
const addJdRedPacket = ref(false)
const expirationDate = ref<DateValue | undefined>()
const datePickerOpen = ref(false)

const isConverting = ref(false)
const resultText = ref('')
const convertResult = ref<BatchConvertResponse | null>(null)
const convertError = ref('')

const hasInput = computed(() => inputText.value.trim().length > 0)
const hasResult = computed(() => resultText.value.length > 0)

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    toast.success(t('batch_convert.paste_success'))
  }
  catch {
    toast.error(t('batch_convert.paste_failed'))
  }
}

function getExpirationTimestamp(date: DateValue | undefined): number | undefined {
  if (!date)
    return undefined
  // Set to end of day (23:59:59)
  const d = date.toDate(getLocalTimeZone())
  d.setHours(23, 59, 59, 0)
  return Math.floor(d.getTime() / 1000)
}

function clearExpiration() {
  expirationDate.value = undefined
}

async function handleConvert() {
  if (!hasInput.value)
    return

  isConverting.value = true
  convertError.value = ''
  convertResult.value = null
  resultText.value = ''

  try {
    const body: { text: string, expiration?: number } = {
      text: inputText.value,
    }
    const exp = getExpirationTimestamp(expirationDate.value)
    if (exp)
      body.expiration = exp

    const data = await useAPI<BatchConvertResponse>('/api/link/batch-convert', {
      method: 'POST',
      body,
    })

    resultText.value = data.result
    convertResult.value = data

    if (addJdRedPacket.value) {
      resultText.value = `领红包 https://maox.net/lucky\n${resultText.value}`
    }

    if (data.failed > 0) {
      toast.warning(t('batch_convert.partial_success', { converted: data.converted, failed: data.failed }))
    }
    else {
      toast.success(t('batch_convert.success', { count: data.converted }))
    }
  }
  catch (error) {
    convertError.value = error instanceof Error ? error.message : String(error)
    toast.error(t('batch_convert.failed'))
  }
  finally {
    isConverting.value = false
  }
}

async function copyResult() {
  if (!resultText.value)
    return
  try {
    await navigator.clipboard.writeText(resultText.value)
    toast.success(t('batch_convert.copy_success'))
  }
  catch {
    toast.error(t('batch_convert.copy_failed'))
  }
}

function reset() {
  inputText.value = ''
  resultText.value = ''
  convertResult.value = null
  convertError.value = ''
  expirationDate.value = undefined
}
</script>

<template>
  <div class="space-y-6">
    <!-- Input Section -->
    <Card>
      <CardHeader>
        <CardTitle>{{ $t('batch_convert.title') }}</CardTitle>
        <CardDescription>{{ $t('batch_convert.description') }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- JD Red Packet Option -->
        <div class="flex items-center gap-2">
          <Checkbox
            id="jd-red-packet"
            v-model="addJdRedPacket"
          />
          <label for="jd-red-packet" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {{ $t('batch_convert.jd_red_packet') }}
          </label>
        </div>

        <!-- Text Input -->
        <div class="space-y-2">
          <label for="batch-input" class="text-sm font-medium">
            {{ $t('batch_convert.input_label') }}
          </label>
          <div class="flex gap-2">
            <Textarea
              id="batch-input"
              v-model="inputText"
              :placeholder="$t('batch_convert.input_placeholder')"
              :rows="12"
              class="resize-y font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              class="shrink-0 self-start"
              :aria-label="$t('batch_convert.paste')"
              @click="handlePaste"
            >
              <ClipboardPaste class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Expiration Setting -->
        <div class="space-y-2">
          <label class="text-sm font-medium">
            {{ $t('batch_convert.expiration_label') }}
          </label>
          <div class="flex items-center gap-2">
            <Popover v-model:open="datePickerOpen">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  :class="cn(
                    'justify-start text-left font-normal',
                    !expirationDate && 'text-muted-foreground',
                  )"
                >
                  <CalendarIcon class="mr-2 h-4 w-4" />
                  {{
                    expirationDate
                      ? expirationDate.toDate(getLocalTimeZone()).toLocaleDateString(locale)
                      : $t('batch_convert.pick_date')
                  }}
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0" align="start">
                <Calendar
                  :model-value="expirationDate"
                  :default-placeholder="today(getLocalTimeZone())"
                  layout="month-and-year"
                  initial-focus
                  @update:model-value="(v: DateValue | undefined) => {
                    expirationDate = v
                    datePickerOpen = false
                  }"
                />
              </PopoverContent>
            </Popover>
            <Button
              v-if="expirationDate"
              variant="ghost"
              size="icon"
              :aria-label="$t('common.cancel')"
              @click="clearExpiration"
            >
              <XCircle class="h-4 w-4" />
            </Button>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ $t('batch_convert.expiration_description') }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <Button
            class="flex-1"
            :disabled="!hasInput || isConverting"
            @click="handleConvert"
          >
            <Loader2 v-if="isConverting" class="mr-2 h-4 w-4 animate-spin" />
            <RefreshCw v-else class="mr-2 h-4 w-4" />
            {{ isConverting ? $t('batch_convert.converting') : $t('batch_convert.button') }}
          </Button>
          <Button variant="outline" :disabled="!hasInput && !hasResult" @click="reset">
            <RotateCcw class="mr-2 h-4 w-4" />
            {{ $t('batch_convert.reset') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Error -->
    <div
      v-if="convertError"
      class="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
    >
      <div class="flex items-center gap-2 text-destructive">
        <XCircle class="h-5 w-5" />
        <span class="font-medium">{{ convertError }}</span>
      </div>
    </div>

    <!-- Result Section -->
    <Card v-if="hasResult">
      <CardHeader>
        <CardTitle>{{ $t('batch_convert.result_title') }}</CardTitle>
        <!-- Stats -->
        <div v-if="convertResult" class="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div class="flex items-center gap-1.5">
            <CheckCircle class="h-4 w-4 text-green-500" />
            <span>{{ $t('batch_convert.stat_created', { count: convertResult.created }) }}</span>
          </div>
          <div v-if="convertResult.failed > 0" class="flex items-center gap-1.5">
            <XCircle class="h-4 w-4 text-red-500" />
            <span>{{ $t('batch_convert.stat_failed', { count: convertResult.failed }) }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span>{{ $t('batch_convert.stat_total', { count: convertResult.total }) }}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="flex gap-2">
          <Textarea
            v-model="resultText"
            :rows="12"
            class="resize-y font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            class="shrink-0 self-start"
            :aria-label="$t('batch_convert.copy')"
            @click="copyResult"
          >
            <Copy class="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
