import { createAsyncThunk } from '@reduxjs/toolkit'
import { linkSettingsAction } from '@/redux/reducers/linkSettings'
import { Preset } from '@/typings/Flux'
import { fetchLinkSettingsPresetsFromAPI } from '../api'

export const fetchLinkSettingsPresets = createAsyncThunk<Array<Preset>, void, { state }>(
  'linkSettings/fetchLinkSettingsPresets',
  async (organizationId, { dispatch }) => {
    const response = await fetchLinkSettingsPresetsFromAPI(organizationId as string)

    dispatch(
      //eslint-disable-next-line @typescript-eslint/no-use-before-define
      linkSettingsAction.setLinkSettingsPresetId(response.find((preset: Preset) => preset.isDefault)?.id),
    )
    //eslint-disable-next-line @typescript-eslint/no-use-before-define
    dispatch(linkSettingsAction.setLinkSettingsPresets(response))

    return response
  },
)
