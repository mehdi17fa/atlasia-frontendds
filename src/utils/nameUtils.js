// Utility helpers to derive human-friendly display names and initials

export function getPartnerDisplayName(partnerLike, fallback = 'Partenaire') {
  if (!partnerLike) return fallback;
  const candidates = [
    partnerLike.fullName,
    partnerLike.displayName,
    partnerLike.companyName,
    partnerLike.organizationName,
    partnerLike.name,
    partnerLike.partnerName,
    partnerLike.contactName,
    partnerLike.username,
    // derive from email before using raw email
    (typeof partnerLike.email === 'string' && partnerLike.email.includes('@'))
      ? partnerLike.email.split('@')[0]
      : null,
    partnerLike.email
  ];
  const chosen = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
  if (chosen) return chosen;
  // As a last resort, build a readable label from the id if available
  if (partnerLike._id) {
    const id = String(partnerLike._id);
    const short = id.length > 6 ? id.slice(-6).toUpperCase() : id.toUpperCase();
    return `${fallback} #${short}`;
  }
  return fallback;
}

export function getPartnerInitials(partnerLike, fallback = 'P') {
  const name = getPartnerDisplayName(partnerLike, '');
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  const initials = (first + second).toUpperCase();
  return initials || fallback;
}

export function getPackagePartnerName(pkg, fallback = 'Partenaire') {
  if (!pkg) return fallback;
  if (pkg.partner) return getPartnerDisplayName(pkg.partner, fallback);
  if (pkg.partnerName && String(pkg.partnerName).trim()) return String(pkg.partnerName).trim();
  if (pkg.partnerId || pkg.partner?._id) {
    const id = String(pkg.partnerId || pkg.partner?._id);
    const short = id.length > 6 ? id.slice(-6).toUpperCase() : id.toUpperCase();
    return `${fallback} #${short}`;
  }
  return fallback;
}

export function getBookingPartnerName(booking, fallback = 'Partenaire') {
  if (!booking) return fallback;
  const packageObj = booking.package || {};
  const partnerObj = packageObj.partner || booking.partner || null;
  const nameFromPartner = partnerObj ? getPartnerDisplayName(partnerObj, '') : '';
  const candidates = [
    nameFromPartner,
    packageObj.partnerName,
    booking.partnerName,
    // email fallbacks
    partnerObj?.email ? partnerObj.email.split('@')[0] : null,
    packageObj?.partnerEmail ? packageObj.partnerEmail.split('@')[0] : null,
    booking.partnerEmail ? booking.partnerEmail.split('@')[0] : null,
    partnerObj?.email,
    packageObj?.partnerEmail,
    booking.partnerEmail
  ];
  const chosen = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
  if (chosen) return chosen;
  // Fallback to readable id if present
  const id = partnerObj?._id || packageObj?.partnerId || null;
  if (id) {
    const sid = String(id);
    const short = sid.length > 6 ? sid.slice(-6).toUpperCase() : sid.toUpperCase();
    return `${fallback} #${short}`;
  }
  return fallback;
}


