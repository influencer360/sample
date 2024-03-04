export const limitText = (content: string, limit: number) => {
  if (content.length <= limit) {
    return content;
  }
  const toShow = content.substring(0, limit) + '...';
  return toShow;
};
