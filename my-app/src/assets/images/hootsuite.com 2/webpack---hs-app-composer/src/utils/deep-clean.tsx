import removeEmpty from '@/utils/remove-empty'
import removeEmptyStrings from '@/utils/remove-empty-strings'
import removeUndefinedOrNull from '@/utils/remove-undefined-or-null'

export default obj => removeEmptyStrings(removeEmpty(removeUndefinedOrNull(obj)))
