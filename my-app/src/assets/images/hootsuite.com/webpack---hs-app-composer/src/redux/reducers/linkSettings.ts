import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { fetchLinkSettingsPresets, fetchLinkShorteners, fetchShortenerConfigs } from '@/redux/actions'
import { LinkShortner, Preset, ShortenerConfig } from '@/typings/Flux'
import { LinkSetting, LinkSettings, LinkTracker } from '@/typings/Message'

export type ComputedLinks = {
  originalUrl: string
  shortenedUrl: string
  targetUrl: string
}

type LinkSettingsState = {
  presets?: Array<Preset>
  linkShorteners?: Array<LinkShortner>
  shortenerConfigs?: Array<ShortenerConfig>

  linkShortenerId?: number
  linkTracker?: LinkTracker
  previouslyComputedLink?: ComputedLinks

  linkSettings: LinkSettings
  presetId?: number
}

const initialState: LinkSettingsState = {
  presets: undefined,
  presetId: undefined,
  linkShorteners: undefined,

  shortenerConfigs: undefined,
  linkShortenerId: undefined,
  linkTracker: undefined,

  previouslyComputedLink: undefined,
  linkSettings: [],
}

const linkSettingSlice = createSlice({
  name: 'linkSettings',
  initialState,
  reducers: {
    setLinkSettingsPresets(state, action: PayloadAction<Array<Preset>>) {
      state.presets = action.payload
    },
    setLinkSettingsPresetId(state, action: PayloadAction<number | undefined>) {
      state.presetId = action.payload
    },
    setLinkShorteners(state: LinkSettingsState, action: PayloadAction<Array<LinkShortner>>) {
      state.linkShorteners = action.payload
    },
    setShortenerConfigs(state: LinkSettingsState, action: PayloadAction<Array<ShortenerConfig>>) {
      state.shortenerConfigs = action.payload
    },
    setLinkSettings(state: LinkSettingsState, action: PayloadAction<LinkSettings>) {
      let linkSettings = action.payload
      if (state.presetId) {
        const selectedPreset = state.presets?.find((preset: Preset) => preset.id === state.presetId)
        linkSettings = linkSettings.map((linkSetting: LinkSetting) => ({
          ...linkSetting,
          linkShortenerId: selectedPreset?.linkShortenerId,
          linkTracker: selectedPreset?.linkTracker,
        }))
      }

      state.linkSettings = linkSettings
    },
    replaceLinkSettingsShortenerid(state: LinkSettingsState, action: PayloadAction<number>) {
      state.linkSettings = state.linkSettings.map((linkSetting: LinkSetting) => ({
        ...linkSetting,
        linkShortenerId: action.payload,
      }))
    },
    replaceLinkSettingsLinkTracker(state: LinkSettingsState, action: PayloadAction<LinkTracker>) {
      state.linkSettings = state.linkSettings.map((linkSetting: LinkSetting) => ({
        ...linkSetting,
        linkTracker: action.payload,
      }))
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchLinkSettingsPresets.fulfilled, (state, action) => {
      state.presets = action.payload
    })
    builder.addCase(fetchLinkSettingsPresets.rejected, state => {
      state.presets = undefined
    })
    builder.addCase(fetchLinkShorteners.fulfilled, (state, action) => {
      state.linkShorteners = action.payload
    })
    builder.addCase(fetchLinkShorteners.rejected, state => {
      state.linkShorteners = undefined
    })
    builder.addCase(fetchShortenerConfigs.fulfilled, (state, action) => {
      state.shortenerConfigs = action.payload
    })
    builder.addCase(fetchShortenerConfigs.rejected, state => {
      state.shortenerConfigs = undefined
    })
  },
})

export const linkSettingsAction = linkSettingSlice.actions
export default linkSettingSlice.reducer
