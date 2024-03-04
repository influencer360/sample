export default function removeEmptyStrings(obj) {
  Object.keys(obj).forEach(k => {
    if (typeof obj[k] === 'string' && obj[k].length === 0) {
      delete obj[k]
    }
  })

  return obj
}
