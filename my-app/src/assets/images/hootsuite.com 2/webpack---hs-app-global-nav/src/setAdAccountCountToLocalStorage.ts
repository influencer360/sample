import { getMyFacebookAdAccounts } from "fe-adp-lib-client-ad-accounts";
import { getSocialNetworks, getMemberMaxPlanCode } from "fe-lib-hs";
import { isFeatureEnabledOrBeta } from "fe-lib-darklaunch";

const KEY = "facebookAdAccountCount";

const setAdAccountToLocalStorage = async () => {
  const adAccountCount = localStorage.getItem(KEY);
  const memberPlanCode = await getMemberMaxPlanCode();
  const socialNetworks = await getSocialNetworks();

  const shouldSetLocalStorage =
    isFeatureEnabledOrBeta("PROM_6713_ADD_ADACCOUNT_COUNT_LOCALSTORAGE") &&
    !isLocalStorageSet(adAccountCount) &&
    hasTeamOrProfessional(memberPlanCode) &&
    hasMetaAccount(socialNetworks);
  if (shouldSetLocalStorage) {
    const adAccounts = await getMyFacebookAdAccounts();
    const adAccountCount = adAccounts.length;
    localStorage.setItem(KEY, adAccountCount.toString());
  }
};

const isLocalStorageSet = (
  adAccountCount: string | null | undefined
): adAccountCount is string => adAccountCount !== null;

const hasMetaAccount = (socialNetworks?: Record<string, any>[]) =>
  Boolean(
    Object.values(socialNetworks || []).find(
      (value) => value.type === "FACEBOOKPAGE"
    )
  );

const hasTeamOrProfessional = (memberMaxPlanCode?: string) =>
  ["TEAM3S", "PROFESSIONAL_PLAN"].includes(memberMaxPlanCode || "");

export default setAdAccountToLocalStorage;
