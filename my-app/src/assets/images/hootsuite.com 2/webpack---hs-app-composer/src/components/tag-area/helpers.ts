export const isDefinedAndNotEmpty = stringToTest => stringToTest && stringToTest !== ''

export const isTagInTags = (tagToFind, tags) =>
  Boolean(
    tags.find(tagToMatch => (tagToFind.id ? tagToFind.id === tagToMatch.id : tagToFind === tagToMatch.name)),
  )

export const mapTagsToPills = (tagsToMap, tagsSelected) =>
  tagsToMap.map(tag => ({
    title: tag.name,
    id: tag.id,
    active: isTagInTags(tag, tagsSelected),
  }))

export const normalizeNewTag = newTag => ({
  name: newTag.name,
  id: newTag.id,
})
