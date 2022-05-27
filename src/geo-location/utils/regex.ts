// Contains any Regex patterns used in the Geo location

// Regex patterns for determining if a device is a mobile device
// Will be used if navigator.userAgentData.mobile is not available/fallback
const mobileDeviceRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export { mobileDeviceRegex };
