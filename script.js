var state = {
  // playlist
  playlist: [],
  playlistIndexByVideoID: {},
  activeIndex: -1,
  pausedAt: 0,

  getPlaylist: function () {
    return this.playlist;
  },
  setPlaylist: function (playlist) {
    this.playlist = playlist;
    for (var i = 0; i < this.playlist.length; i++) {
      this.playlist[i].videoID = videoIDFromURL(this.playlist[i].url);
      this.playlistIndexByVideoID[this.playlist[i].videoID] = i;
    }
  },
  addToPlaylist: function (trackObj) {
    this.playlist.push(trackObj);
    this.playlistIndexByVideoID[trackObj.videoID] = this.playlist.length - 1;
  },
  // TODO OGG: this is not working fine if the same video is added multiple times to the playlist
  setActiveIndex(videoID) {
    var prevActiveIndex = this.activeIndex;
    var newActiveIndex = this.playlistIndexByVideoID[videoID];
    if (newActiveIndex === prevActiveIndex) {
      return;
    }
    this.activeIndex = newActiveIndex;
    highlightActiveItem();
    if (prevActiveIndex >= 0) {
      unhighlightItem(prevActiveIndex);
    }
  },
  getActiveIndex: function () {
    return this.activeIndex;
  },
  nextVideoID: function () {
    if (this.activeIndex === this.playlist.length - 1) {
      return null;
    }
    return this.playlist[this.activeIndex + 1].videoID
  },
  setPausedAt: function (pausedAt) {
    this.pausedAt = pausedAt;
    showPlayOverlayBtn();
  },
  unsetPausedAt: function () {
    this.pausedAt = -1;
    showPauseOverlayBtn();
  },
  getPausedAt: function () {
    return this.pausedAt;
  },

  // notifications
  notifications: [],

  getNotifications: function () {
    return this.notifications;
  },
  setNotifications: function (notifications) {
    this.notifications = notifications;
  },
  removeNotification: function (index) {
    this.notifications.splice(index, 1);
  },
  removeAllNotifications: function (index) {
    this.notifications = [];
  }
}

var bodyElem;
var toggleColorThemeBtnElem;
var topNavElem;
var topNavHamburgerElem;
var topNavLinksElem;

var profileTabBtnElem;
var filterTabBtnElem;
var shareTabBtnElem;
var notificationsTabBtnElem;
var playlistTabBtnElem;

var profileTabElem;

var filterTabElem;

var shareTabElem;
var partyLinkCopiedElem;
var partyLinkElem;
var copyPartyLinkBtnElem;
var partyLinkQRCodeContainerElem;
var printPartyLinkQRCodeElem;

var notificationsTabElem;
var notificationsElem;
var notificationTemplateElem;
var clearNotificationsBtnElem;
var notificationsMsgElem;

var playlistTabElem;
var addToPlaylistSectionElem;
var addToPlaylistInputElem;
var addToPlaylistBtnElem;
var addToPlaylistInProgressElem;
var addToPlaylistErrorElem;
var playlistElem;
var tracksElem;
var playlistItemTemplateElem;

var player;

window.addEventListener('load', (event) => {
  loadYouTubeIframeAPI();
  loadStaticElems();

  const isDarkModeSet = localStorage.getItem('dark');
  if (!isDarkModeSet || isDarkModeSet === 'true') {
    bodyElem.classList.add('dark');
  }
  toggleColorThemeBtnElem.addEventListener('click', function (event) {
    event.preventDefault();
    bodyElem.classList.toggle('dark');
    localStorage.setItem('dark', bodyElem.classList.contains('dark'));
  });

  addOnSpaceKeyUpListener();
  topNavHamburgerElem.addEventListener('click', toggleTopNav);
  window.addEventListener('click', hideTopNav);

  addTabBtnsEventListeners();

  addToPlaylistBtnElem.addEventListener('click', onAddToPlaylistBtnClick);
  addToPlaylistErrorElem.addEventListener('click', function (event) {
    this.classList.add('hidden');
    addToPlaylistSectionElem.classList.remove('hidden');
  });
  loadAndRenderPlaylist();
  loadAndRenderNotifications(false);
  clearNotificationsBtnElem.addEventListener('click', function (event) {
    event.preventDefault();
    state.removeAllNotifications();
    renderNotifications(true);
  });

  copyPartyLinkBtnElem.addEventListener('click', function(event) {
    event.preventDefault();
    copyElementText(partyLinkElem, partyLinkCopiedElem);
  });

  // generate QRCode for party link
  new QRCode(partyLinkQRCodeContainerElem, {
    text: partyLinkElem.innerText,
    width: 256,
    height: 256,
    // colorDark : "#000000",
    // colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });

  printPartyLinkQRCodeElem.addEventListener('click', printPartyLinkQRCode);
});

function addOnSpaceKeyUpListener() {
  document.addEventListener('keydown', event => {
    if (event.code === 'Space' && event.target.tagName !== 'INPUT') {
      event.preventDefault(); // do not scroll page
      playOrPause();
    }
  });
}

function addTabBtnsEventListeners() {
  profileTabBtnElem.addEventListener('click', onProfileTabBtnClick);
  filterTabBtnElem.addEventListener('click', onFilterTabBtnClick);
  shareTabBtnElem.addEventListener('click', onShareTabBtnClick);
  notificationsTabBtnElem.addEventListener('click', onNotificationsTabBtnClick);
  playlistTabBtnElem.addEventListener('click', onPlaylistTabBtnClick);
}

function onProfileTabBtnClick(event) {
  event.preventDefault();
  switchToTab(
    [profileTabBtnElem],
    [profileTabElem],
    [filterTabBtnElem, shareTabBtnElem, notificationsTabBtnElem, playlistTabBtnElem],
    [filterTabElem, shareTabElem, notificationsTabElem, notificationsElem, playlistTabElem, tracksElem]);
}
function onFilterTabBtnClick(event) {
  event.preventDefault();
  switchToTab(
    [filterTabBtnElem],
    [filterTabElem],
    [profileTabBtnElem, shareTabBtnElem, notificationsTabBtnElem, playlistTabBtnElem],
    [profileTabElem, shareTabElem, notificationsTabElem, notificationsElem, playlistTabElem, tracksElem]);
}
function onShareTabBtnClick(event) {
  event.preventDefault();
  switchToTab(
    [shareTabBtnElem],
    [shareTabElem],
    [profileTabBtnElem, filterTabBtnElem, notificationsTabBtnElem, playlistTabBtnElem],
    [profileTabElem, filterTabElem, notificationsTabElem, notificationsElem, playlistTabElem, tracksElem]);
}
function onNotificationsTabBtnClick(event) {
  event.preventDefault();
  switchToTab(
    [notificationsTabBtnElem],
    [notificationsTabElem, notificationsElem],
    [profileTabBtnElem, filterTabBtnElem, shareTabBtnElem, playlistTabBtnElem],
    [profileTabElem, filterTabElem, shareTabElem, playlistTabElem, tracksElem]);
}
function onPlaylistTabBtnClick(event) {
  event.preventDefault();
  switchToTab(
    [playlistTabBtnElem],
    [playlistTabElem, tracksElem],
    [profileTabBtnElem, filterTabBtnElem, shareTabBtnElem, notificationsTabBtnElem],
    [profileTabElem, filterTabElem, shareTabElem, notificationsTabElem, notificationsElem]);
}

function switchToTab(toActivate, toShow, toDeactivate, toHide) {
  for (var i = 0; i < toDeactivate.length; i++) {
    toDeactivate[i].classList.remove('active');
  }
  for (var i = 0; i < toHide.length; i++) {
    toHide[i].classList.add('hidden');
  }
  for (var i = 0; i < toShow.length; i++) {
    toShow[i].classList.remove('hidden');
  }
  for (var i = 0; i < toActivate.length; i++) {
    toActivate[i].classList.add('active');
  }
}

function scrollParentToChild(parent, child) {
  var parentRect = parent.getBoundingClientRect(); // where is the parent on page
  var parentViewableArea = { // what can be seen
    height: parent.clientHeight,
    width: parent.clientWidth
  };
  var childRect = child.getBoundingClientRect(); // where is the child
  // is the child viewable
  var isViewable = (childRect.top >= parentRect.top) && (childRect.bottom <= parentRect.top + parentViewableArea.height);
  if (!isViewable) { // if child is not visible, try to scroll parent
    // find the smaller ABS adjustment to decide whether to scroll using top or bottom
    const scrollTop = childRect.top - parentRect.top;
    const scrollBot = childRect.bottom - parentRect.bottom;
    if (Math.abs(scrollTop) < Math.abs(scrollBot)) {
      parent.scrollTop += scrollTop; // we're near the top of the list
    } else {
      parent.scrollTop += scrollBot; // we're near the bottom of the list
    }
  }
}

//===> YouTube iFrame API
function loadYouTubeIframeAPI() {
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player-1', {
    // ratio is: 640 / 390 = 1.641025641025641
    height: '256',
    width: '420',
    // TODO OGG: make an NoDJ.party intro video and use it's ID here:
    videoId: 'ZGDGdRIxvd0',
    playerVars: {
      'playsinline': 1,
      // 'autoplay': 1,
      'enablejsapi': 1,
      'modestbranding': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  // event.target.playVideo();
  state.setActiveIndex(player.getVideoData()['video_id']);
}

// possible states (see them with console.log(YT.PlayerState)):
// BUFFERING: 3, CUED: 5, ENDED: 0, PAUSED: 2, PLAYING: 1, UNSTARTED: -1
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.UNSTARTED) {
    state.setActiveIndex(player.getVideoData()['video_id']);
    return;
  }
  if (event.data == YT.PlayerState.PLAYING) {
    state.unsetPausedAt();
    return;
  }
  if (event.data == YT.PlayerState.PAUSED) {
    state.setPausedAt(player.getCurrentTime());
    return;
  }
  if (event.data == YT.PlayerState.ENDED) {
    playNext();
    return;
  }
}

function highlightActiveItem() {
  var activeIndex = state.getActiveIndex();
  if (activeIndex < 0) {
    return;
  }
  var itemElem = document.getElementById('item-' + activeIndex);
  itemElem.classList.add('active');
  scrollParentToChild(tracksElem, itemElem);
}

function unhighlightItem(index) {
  var itemElem = document.getElementById('item-' + index);
  itemElem.classList.remove('active');
}

function showPlayOverlayBtn() {
  var activeItemElem = document.getElementById('item-' + state.getActiveIndex());
  var trackImgOverlayElem = activeItemElem.querySelector('.overlay-btn');
  trackImgOverlayElem.classList.remove('pause');
  trackImgOverlayElem.classList.add('play');
}

function showPauseOverlayBtn() {
  var activeItemElem = document.getElementById('item-' + state.getActiveIndex());
  var trackImgOverlayElem = activeItemElem.querySelector('.overlay-btn');
  trackImgOverlayElem.classList.remove('play');
  trackImgOverlayElem.classList.add('pause');
}

function playNext() {
  showPlayOverlayBtn();
  var nextVideoID = state.nextVideoID();
  if (nextVideoID) {
    player.loadVideoById(state.nextVideoID());
  }
}

function playOrPause() {
  if (!player) {
    return;
  }
  var playerState = player.getPlayerState();
  if (playerState === YT.PlayerState.PLAYING) {
    player.pauseVideo();
    return;
  }
  player.playVideo();
}
//<=== YouTube iFrame API

function loadStaticElems() {
  bodyElem = document.getElementsByTagName('body')[0];
  toggleColorThemeBtnElem = document.getElementById('toggle-color-theme');
  topNavElem = document.getElementById('top-nav');
  topNavHamburgerElem = document.getElementById('top-nav-hamburger');
  topNavLinksElem = document.getElementById('top-nav-links');

  profileTabBtnElem = document.getElementById('profile-tab-btn');
  filterTabBtnElem = document.getElementById('filter-tab-btn');
  shareTabBtnElem = document.getElementById('share-tab-btn');
  notificationsTabBtnElem = document.getElementById('notifications-tab-btn');
  playlistTabBtnElem = document.getElementById('playlist-tab-btn');

  profileTabElem = document.getElementById('profile-tab');

  filterTabElem = document.getElementById('filter-tab');

  shareTabElem = document.getElementById('share-tab');
  partyLinkCopiedElem = document.getElementById('party-link-copied');
  partyLinkElem = document.getElementById('party-link');
  copyPartyLinkBtnElem = document.getElementById('copy-party-link-btn');
  partyLinkQRCodeContainerElem = document.getElementById('party-link-qrcode');
  printPartyLinkQRCodeElem = document.getElementById('print-party-link-qrcode-btn');

  notificationsTabElem = document.getElementById('notifications-tab');
  notificationsElem = document.getElementById('notifications');
  notificationTemplateElem = document.getElementById('notification-template');
  clearNotificationsBtnElem = document.getElementById('clear-notifications-btn');
  notificationsMsgElem = document.getElementById('notifications-msg');

  playlistTabElem = document.getElementById('playlist-tab');
  addToPlaylistSectionElem = document.getElementById('add');
  addToPlaylistInputElem = document.getElementById('add-to-playlist-input');
  addToPlaylistBtnElem = document.getElementById('add-to-playlist-btn');
  addToPlaylistInProgressElem = document.getElementById('add-in-progress');
  addToPlaylistErrorElem = document.getElementById('add-error');
  playlistElem = document.getElementById('playlist');
  tracksElem = document.getElementById('items');
  playlistItemTemplateElem = document.getElementById('playlist-item-template');
}

function toggleTopNav(event) {
  event.preventDefault();
  topNavHamburgerElem.classList.toggle('active');
  topNavLinksElem.classList.toggle('hidden');
}

function hideTopNav(event) {
  if (!topNavElem.contains(event.target)) {
    topNavLinksElem.classList.add('hidden');
    topNavHamburgerElem.classList.remove('active');
  }
}

function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

function onAddToPlaylistBtnClick(event) {
  event.preventDefault();
  var youTubeVideoURL = addToPlaylistInputElem.value.trim();
  if (!youTubeVideoURL) {
    return;
  }
  addToPlaylistSectionElem.classList.add('hidden');
  if (!isValidHttpUrl(youTubeVideoURL)) {
    addToPlaylistErrorElem.innerText = 'Invalid URL';
    addToPlaylistErrorElem.classList.remove('hidden');
    return;
  }
  addToPlaylistInProgressElem.classList.remove('hidden');
  youTubeVideoURL = 'https://noembed.com/embed?url=' + youTubeVideoURL;
  fetch(youTubeVideoURL).then(function (response) {
    return response.json();
  }).then(function (json) {
    addToPlaylistInProgressElem.classList.add('hidden');
    if (json.error) {
      if (console) {
        console.error('Add to playlist failed:', json.error);
      }
      addToPlaylistErrorElem.innerText = 'Add to playlist failed :(';
      addToPlaylistErrorElem.classList.remove('hidden');
      return;
    }
    var videoID = videoIDFromURL(json.url);
    state.addToPlaylist({
      videoID: videoID,
      url: json.url,
      thumbnail: json.thumbnail_url,
      title: json.title,
      user: 'someCurrentUsername',
      rank: (state.playlist.length + 1) * 1000,
      likes: 0
    });
    renderPlaylist();
    highlightActiveItem();
    addToPlaylistInputElem.value = '';
    addToPlaylistSectionElem.classList.remove('hidden');
    // console.log('noembed response:', json);
  }).catch(function (err) {
    if (console) {
      console.error('Error fetching video', youTubeVideoURL, err);
    }
    addToPlaylistInProgressElem.classList.add('hidden');
    addToPlaylistErrorElem.innerText = 'Add to playlist failed :(';
    addToPlaylistErrorElem.classList.remove('hidden');
  });
}

function loadAndRenderPlaylist() {
  state.setPlaylist([
    {
      url: 'https://www.youtube.com/watch?v=ZGDGdRIxvd0',
      thumbnail: 'http://img.youtube.com/vi/ZGDGdRIxvd0/0.jpg',
      title: 'Gesaffelstein & The Weeknd - Lost in the Fire (Official Video)',
      user: 'somePartyGoer1',
      rank: 1000,
      likes: 13
    },
    {
      url: 'https://youtu.be/XkGz_4KYjKM',
      thumbnail: 'http://img.youtube.com/vi/XkGz_4KYjKM/0.jpg',
      title: 'REZZ - Edge',
      user: 'someOtherPartyGoer2',
      rank: 2000,
      likes: 10
    },
    {
      url: 'https://www.youtube.com/watch?v=DNhDh3xKwOo',
      thumbnail: 'http://img.youtube.com/vi/DNhDh3xKwOo/0.jpg',
      title: 'Fantome - Pașii Mei (feat. Ioana Milculescu)',
      user: 'yetAnotherPartyGoer3',
      rank: 3000,
      likes: 0
    }
  ]);
  renderPlaylist();
}

function toHTMLEntities(str) {
  return str.replace(/./gm, function (s) {
    return (s.match(/[a-z0-9\s]+/i)) ? s : '&#' + s.charCodeAt(0) + ';';
  });
};

function renderPlaylist() {
  tracksElem.innerHTML = '';
  var playlist = state.getPlaylist();
  for (var i = 0; i < playlist.length; i++) {
    var html = playlistItemTemplateElem.innerHTML.replaceAll('{index}', i);
    html = html.replaceAll('{thumbnail}', playlist[i].thumbnail);
    html = html.replaceAll('{title}', toHTMLEntities(playlist[i].title));
    html = html.replaceAll('{user}', playlist[i].user);
    html = html.replaceAll('{rank}', playlist[i].rank);
    html = html.replaceAll('{likes}', playlist[i].likes);
    tracksElem.innerHTML += html;
  }

  var tracksElems = tracksElem.getElementsByClassName('item');
  for (var i = 0; i < tracksElems.length; i++) {
    var trackImgOverlayElem = tracksElems[i].querySelector('.overlay-btn');
    trackImgOverlayElem.addEventListener('click', onTrackClick);
  }
}

function onTrackClick(event) {
  if (!player) {
    return;
  }
  var elem = event.target;
  if (elem !== this) {
    elem = elem.parentElement;
  }
  var trackIndex = elem.parentElement.getElementsByTagName('input')[0].value;
  var playlist = state.getPlaylist();
  var track = playlist[trackIndex];
  var clickedVideoID = track.videoID;
  var playerVideoID = player.getVideoData()['video_id'];
  // clicked video is different than video in player
  if (playerVideoID !== clickedVideoID) {
    player.loadVideoById(track.videoID);
    return;
  }
  // clicked video is the same as video in player
  playOrPause();
}

function videoIDFromURL(url) {
  const urlAndQueryparams = url.split('?');
  var videoID;
  // try to extract it from the 'v' query parameter
  if (urlAndQueryparams.length > 1) {
    const urlSearchParams = new URLSearchParams(urlAndQueryparams[1]);
    videoID = urlSearchParams.get('v');
  }
  // use the last part of the url path as the videoID
  if (!videoID) {
    const urlPieces = urlAndQueryparams[0].split('/');
    videoID = urlPieces[urlPieces.length - 1];
  }
  return videoID;
}

function loadAndRenderNotifications(showNotifications) {
  state.setNotifications([
    {
      message: '<a>@somePartyGoer1</a> liked your video <a>"Gesaffelstein & The Weeknd - Lost in the Fire (Official Video)"</a>. Video is now on position <a>#1000</a>.',
      time: new Date(),
    },
    {
      message: '<a>@someOtherPartyGoer2</a> added <a>"REZZ - Edge"</a> to the playlist. Video is on position <a>#2000</a>.',
      time: new Date(),
    },
    {
      message: '<a>@yetAnotherPartyGoer3</a> joined the party!',
      time: new Date(),
    },
    {
      message: '<a>@yetAnotherPartyGoer3</a> added <a>"Fantome - Pașii Mei (feat. Ioana Milculescu)"</a> to the playlist. Video is on position <a>#3000</a>.',
      time: new Date(),
    },
  ]);
  renderNotifications(showNotifications);
}

function renderNotifications(showNotifications) {
  notificationsElem.innerHTML = '';
  var notifications = state.getNotifications();
  if (notifications.length === 0) {
    clearNotificationsBtnElem.classList.add('hidden');
    notificationsMsgElem.innerHTML = '<em>No notifications</em>';
    notificationsElem.classList.add('hidden');
    notificationsTabBtnElem.classList.remove('unread');
    return;
  }

  for (var i = 0; i < notifications.length; i++) {
    var html = notificationTemplateElem.innerHTML.replaceAll('{index}', i);
    html = html.replaceAll('{message}', notifications[i].message);
    html = html.replaceAll('{time}', notifications[i].time.toLocaleString(
      window.navigator.language || window.navigator.userLanguage,
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }));
    notificationsElem.innerHTML += html;
  }

  var notificationsElems = notificationsElem.getElementsByClassName('notification');
  for (var i = 0; i < notificationsElems.length; i++) {
    var markAsReadBtnElem = notificationsElems[i].querySelector('.close-btn');
    markAsReadBtnElem.addEventListener('click', onMarkNotificationAsReadClick);
  }

  clearNotificationsBtnElem.classList.remove('hidden');
  var ns = 'notification';
  if (notifications.length > 1) {
    ns += 's';
  }
  notificationsMsgElem.innerHTML = '<strong>' + notifications.length + '</strong> <em>' + ns + '</em>';
  if (showNotifications) {
    notificationsElem.classList.remove('hidden');
  }
  notificationsTabBtnElem.classList.add('unread');
}

function onMarkNotificationAsReadClick(event) {
  var notificationIndex = event.target.parentElement.getElementsByTagName('input')[0].value;
  state.removeNotification(notificationIndex);
  renderNotifications(true);
}

function selectElementText(elem) {
  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(elem);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(elem);
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (console) {
    console.warn("Could not select text in node: Unsupported browser.");
  }
}

function copyElementText(elem, msgElem) {
  selectElementText(elem);
  navigator.clipboard.writeText(elem.innerText);
  msgElem.classList.remove('hidden');
  setTimeout(() => { msgElem.classList.add('hidden'); }, 2000);
}

function printPartyLinkQRCode(event) {
    event.preventDefault();
    var divContents = partyLinkQRCodeContainerElem.innerHTML;
    var a = window.open('', '', 'height=600, width=600');
    a.document.write('<html>');
    a.document.write('<style>canvas, img { margin: 4em auto; }</style>');
    a.document.write('<body style="text-align: center;">');
    a.document.write(divContents);
    a.document.write('</body></html>');
    a.print();
    a.window.close();
}