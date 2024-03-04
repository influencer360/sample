export default function removeEmpty(obj) {
  Object.keys(obj).forEach(k => {
    if (
      (typeof obj[k] === 'object' && obj[k] && Object.keys(obj[k]).length === 0) ||
      (Array.isArray(obj[k]) && obj[k].length === 0)
    ) {
      delete obj[k]
    }
  })

  return obj
}
