/** @format */

let facadeApiUrl

const setup = options => {
  facadeApiUrl = options.facadeApiUrl || ''
}

const getUrl = () => facadeApiUrl

export default {
  getUrl,
  setup,
}
