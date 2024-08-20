(function ($) {
  $(document).ready(function () {
    console.log('loaded')
  });
})(jQuery);

function nameCleaning(nameString, noHtml = true) {
  // Removed things between () on last_name
  nameString = nameString.replace(/\(([^)]+)\)/, "")

  // Remove Special Char's from final string.
  nameString = nameString.replace(/[^\p{Letter}\p{Mark}]+/gu, ' ').trim();

  // Remove Certification Acronyms

  if (noHtml) {
    // 1. Remove text whitespace.
    nameString = nameString.split(' ')[0];
  }

  // 2. Remove text after ,
  nameString = nameString.split(',')[0];

  return nameString;
}

function decodeAmpTwice(data = "") {
  return (data || "").replace(/&amp;/g, '&');
};

function sanitizeLIUrl(url) {
  if (url) {
    var split_token = 'linkedin.com';
    var li_slug = url.split(split_token)[1];
    if (li_slug) {
      url = 'https://www.' + split_token + li_slug;
      return url;
    } else {
      return url;
    }
  } else {
    return null;
  }
};

function formatUrl(url, delimiter) {
  if (url) {
    if (url.includes('linkedin.com')) {
      url = url.split(delimiter)[0];
    } else {
      url = 'https://www.linkedin.com' + url.split(delimiter)[0];
    }
  }
  return url;
};

function extractMemberIdentity(url, key) {
  if (url.split(key).length && url.split(key)[1] && url.split(key)[1].split('/').length) {
    if (url.split(key)[1].split('/')[0] === 'unavailable') {
      return null;
    } else {
      return url.split(key)[1].split('/')[0];
    }
  } else {
    return null;
  }
}

function decodeAmp(data = "") {
  if (data && data.length === 1 && data[0] == "") {
    data = "";
  }
  return decodeAmpTwice((data || "").replace(/&amp;/g, '&'));
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.title === "getWindowInfo") {
    chrome.runtime.sendMessage({
      title: 'setWindowInfo',
      screenWidth: `${window.screen.width}`,
      screenHeight: `${window.screen.height}`,
      tabId: `${message.tab.id}`,
      baseURL: "https://stagingapp.dealsignal.com/api/v0",
      baseURLV1: "https://stagingapp.dealsignal.com/api/v1"
    });
    sendResponse(true);
    return true;
  }

  if (message.title === "parsePage") {

    const profile = { basic_info: [{}] };

    let topNode = $('.top-card-background-hero-image');
    let topSiblings = topNode ? topNode.siblings()[0] : null;
    let topChild = topSiblings ? topSiblings.children[1] : null;
    let infoContainer = topChild ? topChild.children[0] : null;

    if (infoContainer) {
      profile.basic_info[0].headline = nameCleaning(infoContainer.children[1].textContent, false);
    }

    const profileName = nameCleaning(decodeAmp($('.pv-top-card-profile-picture__image--show').attr('alt')), false);

    if (profileName.length) {
      profile.basic_info[0].name = profileName;
    } else {
      profile.basic_info[0].name = nameCleaning(decodeAmp($('.profile-photo-edit__preview').attr('alt')), false);
    }

    let profileImage = $('.pv-top-card-profile-picture__image--show').attr('src');
    if (profileImage) {
      profile.basic_info[0].image_url = profileImage;
    } else {
      profile.basic_info[0].image_url = $('.profile-photo-edit__preview').attr('src');
    }

    if (profile.basic_info[0].image_url === undefined || profile.basic_info[0].image_url.includes('data:image')) {
      profile.basic_info[0].image_url = `images/default_contact_image.png`;
    }

    let windowUrl = sanitizeLIUrl(formatUrl(location.href, '?'));
    if (extractMemberIdentity(windowUrl, '/in/')) {
      profile.linkedin_url = `https://www.linkedin.com/in/${extractMemberIdentity(windowUrl, '/in/')}`
    }

    chrome.runtime.sendMessage({ title: 'parsedDataFromCS', payload: profile });
    sendResponse(profile)
  }
});

