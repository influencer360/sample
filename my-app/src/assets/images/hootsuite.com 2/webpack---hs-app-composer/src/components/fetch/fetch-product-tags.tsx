import React, { useEffect } from 'react'
import { connect } from 'fe-hoc-connect'
import { actions as ComposerMessageActions } from 'fe-pnc-data-composer-message'
import { setCatalogs, setProducts, setIsLoadingProducts, store as productStore } from 'fe-pnc-data-products'
import type { ProductState, Catalogs, Products } from 'fe-pnc-data-products'
import { getCatalogs, searchProducts } from 'fe-pnc-lib-api'

import { useDebounce } from 'fe-pnc-lib-hooks'
import ComposerConstants from '@/constants/composer'

interface FetchProductTagsProps {
  catalogs: Catalogs
  endCursor: string | null
  maxProducts?: number
  productSearchString?: string
  socialProfileId?: string
  isTaggingMode?: boolean
  messageId?: number | null
}

const FetchProductTags: React.FunctionComponent<FetchProductTagsProps> = ({
  catalogs = [],
  endCursor,
  isTaggingMode = false,
  maxProducts,
  productSearchString = '',
  socialProfileId = '',
  messageId,
}) => {
  const debouncedSearch = useDebounce(productSearchString, ComposerConstants.SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    const catalogId = catalogs.length && catalogs[0].catalogId

    if (!catalogId || !isTaggingMode || !socialProfileId) return

    setIsLoadingProducts(true)

    searchProducts(socialProfileId, catalogId, maxProducts, endCursor, debouncedSearch)
      .then((data: { items: Products }) => {
        setProducts(data.items)
      })
      .finally(() => {
        setIsLoadingProducts(false)
      })
  }, [catalogs, isTaggingMode, maxProducts, debouncedSearch, socialProfileId, endCursor])

  useEffect(() => {
    if (!socialProfileId) return

    getCatalogs(socialProfileId).then((data: { items: Catalogs }) => {
      setCatalogs(data.items)

      const hasCatalogs = data.items?.length !== 0
      ComposerMessageActions.updateHasCatalogsById(messageId, {
        snId: socialProfileId,
        hasCatalogs,
      })
    })
  }, [socialProfileId])

  return null
}

const ConnectedFetchProductTags = connect(productStore, (state: ProductState) => ({
  catalogs: state.catalogs,
  endCursor: state.endCursor,
  productSearchString: state.productSearchString,
}))(FetchProductTags)

export default ConnectedFetchProductTags
