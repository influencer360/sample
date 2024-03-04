import { withCTTIInstance } from 'fe-pnc-lib-ctti'

import TagArea from './tag-area'

const ExportClass = withCTTIInstance('Composer', 'TagArea', TagArea)

export default ExportClass
export { TagArea as UnwrappedTagArea }
