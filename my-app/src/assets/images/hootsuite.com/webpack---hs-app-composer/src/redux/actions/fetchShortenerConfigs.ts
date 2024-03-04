import { createAsyncThunk } from '@reduxjs/toolkit'
import { ShortenerConfig } from '@/typings/Flux'
import { fetchShortenerConfigsFromAPI } from '../api'

export const fetchShortenerConfigs = createAsyncThunk<Array<ShortenerConfig>, void, { state }>(
  'linkSettings/fetchShortenerConfigs',
  async organizationId => {
    const response = await fetchShortenerConfigsFromAPI(organizationId as string)

    return response
  },
)
