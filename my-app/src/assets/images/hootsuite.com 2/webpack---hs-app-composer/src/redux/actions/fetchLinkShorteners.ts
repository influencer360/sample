import { createAsyncThunk } from '@reduxjs/toolkit'
import { fetchLinkShortenersFromAPI } from '@/redux/api/fetchLinkShortenersFromAPI'
import { LinkShortner } from '@/typings/Flux'

export const fetchLinkShorteners = createAsyncThunk<Array<LinkShortner>, void, { state }>(
  'linkSettings/fetchLinkShorteners',
  async organizationId => {
    const response = await fetchLinkShortenersFromAPI(organizationId as string)

    return response
  },
)
