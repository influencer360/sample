export const getSocialNetworkById = (id: string) => {
  return window.hs.socialNetworks[id];
};

export const parseTimeStamp = (rawDate: string) => {
  const [, month, day, year] = new Date(rawDate).toString().split(' ');
  return `${month} ${parseInt(day)}, ${year}`;
};
