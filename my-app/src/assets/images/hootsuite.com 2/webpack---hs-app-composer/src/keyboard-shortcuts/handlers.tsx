const SELECTORS = {
  EMOJI_BUTTON: '.vk-EmojiBox',
}

const clickElement = selector => {
  const element = document.querySelector<HTMLElement>(selector)
  setTimeout(() => element?.click(), 0)
}

export const handleSwitchNetwork = data => {
  const LEFT = 'left'
  const RIGHT = 'right'
  const snTabContainerId = 'message-tab-bar'

  const tabsCollection = document.getElementById(snTabContainerId).children
  if (tabsCollection) {
    const numTabs = tabsCollection.length
    const tabs = []

    for (let i = 0; i < numTabs; i++) {
      tabs.push(tabsCollection.item(i))
    }

    const activeIndex = tabs.findIndex(tab => tab.getAttribute('tabindex') === '0')

    if (data.direction === LEFT && activeIndex > 0) {
      tabs[activeIndex - 1]?.click()
    } else if (data.direction === RIGHT && activeIndex < numTabs) {
      tabs[activeIndex + 1]?.click()
    }
  }
}
export const handleEmoji = () => {
  clickElement(SELECTORS.EMOJI_BUTTON)
}
