import { Source, UtilType } from "../types";

export default function buildMakeSource({ Utils }: { Utils: UtilType }) {
	return function makeSource({
		ip,
		browser,
		referrer,
		platform,
		version
	}: Source) {
		if (!ip) {
			throw new Error("Request source must contain an IP.");
		}
		if (!Utils.isValidIP(ip)) {
			throw new RangeError("Request source must contain a valid IP.");
		}
		return Object.freeze({
			getIp: () => ip,
			getBrowser: () => Utils.test_input(browser),
			getReferrer: () => Utils.test_input(referrer),
			getPlatform: () => platform,
			getVersion: () => Utils.test_input(version)
		});
	};
}
