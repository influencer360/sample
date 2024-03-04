export default function removeUndefinedOrNull(obj) {
  Object.keys(obj).forEach(k => {
    if (obj[k] === undefined || obj[k] === null) {
      delete obj[k]
    }
  })

  return obj
}
