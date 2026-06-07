import { LinkSchema } from '#shared/schemas/link'
import { z } from 'zod'

defineRouteMeta({
  openAPI: {
    description: 'Batch convert URLs in text to short links',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['text'],
            properties: {
              text: { type: 'string', description: 'The text containing URLs to convert' },
              expiration: { type: 'integer', description: 'Optional expiration timestamp (unix seconds) for all created links' },
            },
          },
        },
      },
    },
  },
})

const BatchConvertSchema = z.object({
  text: z.string().trim().min(1).max(50000),
  expiration: z.number().int().safe().optional(),
})

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\]]+/g

export default eventHandler(async (event) => {
  const { text, expiration } = await readValidatedBody(event, BatchConvertSchema.parse)

  // Validate expiration if provided
  if (expiration !== undefined && expiration <= Math.floor(Date.now() / 1000)) {
    throw createError({
      status: 400,
      statusText: 'expiration must be greater than current time',
    })
  }

  // Extract all URLs from the text
  const urlMatches = text.match(URL_REGEX)
  if (!urlMatches || urlMatches.length === 0) {
    throw createError({
      status: 400,
      statusText: 'No URLs found in the text',
    })
  }

  // Deduplicate URLs while preserving order (same URL in text -> same short link)
  const uniqueUrls = [...new Set(urlMatches)]

  // Build a map of URL -> shortLink
  const urlToShortLink = new Map<string, string>()
  let created = 0
  let failed = 0

  for (const url of uniqueUrls) {
    try {
      const linkData = { url, expiration }
      const link = await LinkSchema.parseAsync(linkData)
      await prepareIncomingLink(event, link)
      await hashLinkPasswordForCreate(link)
      await putLink(event, link)
      urlToShortLink.set(url, buildShortLink(event, link.slug))
      created++
    }
    catch {
      failed++
    }
  }

  // Replace all URLs in the original text with short links
  let resultText = text
  for (const [url, shortLink] of urlToShortLink) {
    resultText = resultText.replaceAll(url, shortLink)
  }

  setResponseHeader(event, 'Cache-Control', 'no-store')
  return {
    result: resultText,
    converted: urlToShortLink.size,
    total: uniqueUrls.length,
    created,
    failed,
  }
})
