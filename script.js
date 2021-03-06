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
    highlightActiveTrack();
    if (prevActiveIndex >= 0) {
      unhighlightTrack(prevActiveIndex);
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

  // partygoers
  partygoers: [],

  getPartygoers: function () {
    return this.partygoers;
  },
  setPartygoers: function (partygoers) {
    this.partygoers = partygoers;
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

var player;
var tabContainerElem;

var shareTabBtnElem;
var notificationsTabBtnElem;
var playlistTabBtnElem;

var shareTabElem;
var partyLinkCopiedElem;
var partyLinkElem;
var copyPartyLinkBtnElem;
var togglePartyLinkQRCodeBtnElem;
var partyLinkQRCodeContainerElem;
var printPartyLinkQRCodeElem;
var partygoersElem;
var partygoerTemplateElem;

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
var addToPlaylistSuccessElem;
var toggleAddToPlaylistBtnElem;
var toggleFilterPlaylistBtnElem;
var addSectionElem;
var filterPlaylistSelectUserElem;
var filterPlaylistInputElem;
var tracksElem;
var playlistTrackTemplateElem;

window.addEventListener('load', (event) => {
  loadYouTubeIframeAPI();
  loadStaticElems();

  const isDarkModeSet = localStorage.getItem('dark');
  if (isDarkModeSet === 'false') {
    bodyElem.classList.remove('dark');
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
  addToPlaylistSuccessElem.addEventListener('click', function (event) {
    this.classList.add('hidden');
    addToPlaylistSectionElem.classList.remove('hidden');
  });
  toggleAddToPlaylistBtnElem.addEventListener('click', function (event) {
    if (toggleAddToPlaylistBtnElem.classList.contains('active')) {
      addSectionElem.classList.add('hidden');
      addToPlaylistInProgressElem.classList.add('hidden');
      addToPlaylistErrorElem.classList.add('hidden');
      addToPlaylistSuccessElem.classList.add('hidden');
      addToPlaylistInputElem.value = '';
      toggleAddToPlaylistBtnElem.classList.remove('active');
      return;
    }
    filterPlaylistSelectUserElem.classList.add('hidden');
    filterPlaylistInputElem.classList.add('hidden');
    toggleFilterPlaylistBtnElem.classList.remove('active');
    addSectionElem.classList.remove('hidden');
    toggleAddToPlaylistBtnElem.classList.add('active');
  });
  toggleFilterPlaylistBtnElem.addEventListener('click', function (event) {
    if (toggleFilterPlaylistBtnElem.classList.contains('active')) {
      filterPlaylistSelectUserElem.classList.add('hidden');
      filterPlaylistInputElem.classList.add('hidden');
      toggleFilterPlaylistBtnElem.classList.remove('active');
      return
    }
    addSectionElem.classList.add('hidden');
    addToPlaylistInProgressElem.classList.add('hidden');
    addToPlaylistErrorElem.classList.add('hidden');
    addToPlaylistSuccessElem.classList.add('hidden');
    addToPlaylistInputElem.value = '';
    toggleAddToPlaylistBtnElem.classList.remove('active');
    filterPlaylistSelectUserElem.classList.remove('hidden');
    filterPlaylistInputElem.classList.remove('hidden');
    toggleFilterPlaylistBtnElem.classList.add('active');
  });
  loadAndRenderPlaylist();
  loadAndRenderPartygoers(false);
  loadAndRenderNotifications(false);
  clearNotificationsBtnElem.addEventListener('click', function (event) {
    event.preventDefault();
    state.removeAllNotifications();
    renderNotifications(true);
  });

  var copyInProgress = false;
  copyPartyLinkBtnElem.addEventListener('click', function(event) {
    event.preventDefault();
    if (copyInProgress) {
      return
    }
    copyInProgress = true;
    copyPartyLinkBtnElem.classList.add('active');
    copyElementText(partyLinkElem, partyLinkCopiedElem);
    setTimeout(() => {
      copyPartyLinkBtnElem.classList.remove('active');
      copyInProgress = false;
    }, 2000);
  });
  togglePartyLinkQRCodeBtnElem.addEventListener('click', function(event) {
    event.preventDefault();
    partyLinkQRCodeContainerElem.classList.toggle('hidden');
    printPartyLinkQRCodeElem.classList.toggle('hidden');
    togglePartyLinkQRCodeBtnElem.classList.toggle('active');
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
  shareTabBtnElem.addEventListener('click', onShareTabBtnClick);
  notificationsTabBtnElem.addEventListener('click', onNotificationsTabBtnClick);
  playlistTabBtnElem.addEventListener('click', onPlaylistTabBtnClick);
}

function onShareTabBtnClick(event) {
  event.preventDefault();
  switchToTab(
    [shareTabBtnElem],
    [shareTabElem, partygoersElem],
    [notificationsTabBtnElem, playlistTabBtnElem],
    [notificationsTabElem, notificationsElem, playlistTabElem, tracksElem]);
}
function onNotificationsTabBtnClick(event) {
  event.preventDefault();
  switchToTab(
    [notificationsTabBtnElem],
    [notificationsTabElem, notificationsElem],
    [shareTabBtnElem, playlistTabBtnElem],
    [shareTabElem, partygoersElem, playlistTabElem, tracksElem]);
}
function onPlaylistTabBtnClick(event) {
  event.preventDefault();
  switchToTab(
    [playlistTabBtnElem],
    [playlistTabElem, tracksElem],
    [shareTabBtnElem, notificationsTabBtnElem],
    [shareTabElem, partygoersElem, notificationsTabElem, notificationsElem]);
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

function highlightActiveTrack() {
  var activeIndex = state.getActiveIndex();
  if (activeIndex < 0) {
    return;
  }
  var trackElem = document.getElementById('track-' + activeIndex);
  trackElem.classList.add('active');
  scrollParentToChild(tracksElem, trackElem);
}

function unhighlightTrack(index) {
  var trackElem = document.getElementById('track-' + index);
  trackElem.classList.remove('active');
}

function showPlayOverlayBtn() {
  var activeTrackElem = document.getElementById('track-' + state.getActiveIndex());
  var trackImgOverlayElem = activeTrackElem.querySelector('.overlay-btn');
  trackImgOverlayElem.classList.remove('pause');
  trackImgOverlayElem.classList.add('play');
}

function showPauseOverlayBtn() {
  var activeTrackElem = document.getElementById('track-' + state.getActiveIndex());
  var trackImgOverlayElem = activeTrackElem.querySelector('.overlay-btn');
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

  shareTabBtnElem = document.getElementById('share-tab-btn');
  notificationsTabBtnElem = document.getElementById('notifications-tab-btn');
  playlistTabBtnElem = document.getElementById('playlist-tab-btn');

  shareTabElem = document.getElementById('share-tab');
  partyLinkCopiedElem = document.getElementById('party-link-copied');
  partyLinkElem = document.getElementById('party-link');
  copyPartyLinkBtnElem = document.getElementById('copy-party-link-btn');
  togglePartyLinkQRCodeBtnElem = document.getElementById('toggle-party-link-qrcode-btn');
  partyLinkQRCodeContainerElem = document.getElementById('party-link-qrcode');
  printPartyLinkQRCodeElem = document.getElementById('print-party-link-qrcode-btn');
  partygoersElem = document.getElementById('partygoers');
  partygoerTemplateElem = document.getElementById('partygoer-template');

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
  addToPlaylistSuccessElem = document.getElementById('add-success');
  toggleAddToPlaylistBtnElem = document.getElementById('toggle-add-to-playlist-btn');
  toggleFilterPlaylistBtnElem = document.getElementById('toggle-filter-playlist-btn');
  addSectionElem = document.getElementById('add');
  filterPlaylistSelectUserElem = document.getElementById('filter-playlist-select-user');
  filterPlaylistInputElem = document.getElementById('filter-playlist-input');
  tabContainerElem = document.getElementById('tab-container');
  tracksElem = document.getElementById('tracks');
  playlistTrackTemplateElem = document.getElementById('playlist-track-template');
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

function showError(err) {
  addToPlaylistErrorElem.innerText = err;
  addToPlaylistErrorElem.classList.remove('hidden');
}

function showSuccess(msg) {
  addToPlaylistSuccessElem.innerText = msg;
  addToPlaylistSuccessElem.classList.remove('hidden');
}
var addToPlaylistInProgress = false;
function onAddToPlaylistBtnClick(event) {
  event.preventDefault();
  if (addToPlaylistInProgress) {
    return;
  }
  addToPlaylistInProgress = true;
  var youTubeVideoURL = addToPlaylistInputElem.value.trim();
  if (!youTubeVideoURL) {
    addToPlaylistInProgress = false;
    return;
  }
  addToPlaylistSectionElem.classList.add('hidden');
  if (!isValidHttpUrl(youTubeVideoURL)) {
    showError('Invalid URL ????');
    addToPlaylistInProgress = false;
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
      showError('Add to playlist failed ????');
      addToPlaylistInProgress = false;
      return;
    }
    var videoID = videoIDFromURL(json.url);
    var trackObj = {
      videoID: videoID,
      url: json.url,
      thumbnail: json.thumbnail_url,
      title: json.title,
      user: 'someCurrentUsername',
      rank: (state.playlist.length + 1) * 1000,
      likes: 0
    }
    state.addToPlaylist(trackObj);
    renderPlaylist();
    highlightActiveTrack();
    addToPlaylistInputElem.value = '';
    showSuccess('Track added on position '+trackObj.rank+' ????');
    addToPlaylistInProgress = false;
  }).catch(function (err) {
    if (console) {
      console.error('Error fetching video', youTubeVideoURL, err);
    }
    addToPlaylistInProgressElem.classList.add('hidden');
    showError('Add to playlist failed ????');
    addToPlaylistInProgress = false;
  });
}

function loadAndRenderPlaylist() {
  state.setPlaylist([
    {
      url: 'https://www.youtube.com/watch?v=ZGDGdRIxvd0',
      thumbnail: 'https://img.youtube.com/vi/ZGDGdRIxvd0/0.jpg',
      title: 'Gesaffelstein & The Weeknd - Lost in the Fire (Official Video)',
      user: 'somePartyGoer1',
      rank: 1000,
      likes: 13
    },
    {
      url: 'https://youtu.be/XkGz_4KYjKM',
      thumbnail: 'https://img.youtube.com/vi/XkGz_4KYjKM/0.jpg',
      title: 'REZZ - Edge',
      user: 'someOtherPartyGoer2',
      rank: 2000,
      likes: 10
    },
    {
      url: 'https://www.youtube.com/watch?v=DNhDh3xKwOo',
      thumbnail: 'https://img.youtube.com/vi/DNhDh3xKwOo/0.jpg',
      title: 'Fantome - Pa??ii Mei (feat. Ioana Milculescu)',
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
    var html = playlistTrackTemplateElem.innerHTML.replaceAll('{index}', i);
    html = html.replaceAll('{thumbnail}', playlist[i].thumbnail);
    html = html.replaceAll('{title}', toHTMLEntities(playlist[i].title));
    html = html.replaceAll('{user}', playlist[i].user);
    html = html.replaceAll('{rank}', playlist[i].rank);
    html = html.replaceAll('{likes}', playlist[i].likes);
    tracksElem.innerHTML += html;
  }

  var tracksElems = tracksElem.getElementsByClassName('track');
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

function loadAndRenderPartygoers(showPartygoers) {
  state.setPartygoers([
    {
      photo: "",
      name: "A Partygoer One",
      username: "somePartyGoer1"
    },
    {
      photo: "",
      name: "B Partygoer Two",
      username: "somePartyGoer2"
    },
    {
      photo: "",
      name: "C Partygoer Three",
      username: "somePartyGoer3"
    },
  ]);
  renderPartygoers(showPartygoers);
}

function renderPartygoers(showPartygoers) {
  partygoersElem.innerHTML = '';
  var partygoers = state.getPartygoers();
  if (partygoers.length === 0) {
    return;
  }

  for (var i = 0; i < partygoers.length; i++) {
    var html = partygoerTemplateElem.innerHTML.replaceAll('{index}', i);
    if (partygoers[i].photo !== "") {
      html = html.replaceAll('{photo}', partygoers[i].photo);
      html = html.replaceAll('nophoto-hidden', 'hidden');
      html = html.replaceAll('photo-hidden', '');
    } else {
      var namePieces = partygoers[i].name.split(" ");
      var initials = partygoers[i].name.charAt(0);
      if (namePieces.length > 0) {
        initials = namePieces[0].charAt(0);
      }
      if (namePieces.length > 1) {
        initials += namePieces[1].charAt(0);
      }
      html = html.replaceAll('color;', stringToHexColor(partygoers[i].name)+";");
      html = html.replaceAll('{letter}', initials);
      html = html.replaceAll('photo-hidden', 'hidden');
      html = html.replaceAll('nophoto-hidden', '');
    }
    html = html.replaceAll('{name}', partygoers[i].name);
    html = html.replaceAll('{username}', partygoers[i].username);
    partygoersElem.innerHTML += html;
  }

  if (showPartygoers) {
    partygoersElem.classList.remove('hidden');
  }
}

function stringToHexColor(str) {
  var hash = 0;
    if (str.length === 0) return hash;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    var color = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 255;
        var v = ('00' + value.toString(16));
        color += v.substring(v.length-2, v.length);
    }
    return color;
}

function loadAndRenderNotifications(showNotifications) {
  state.setNotifications([
    {
      message: '<a>@somePartyGoer1</a> liked your video <a>"Gesaffelstein & The Weeknd - Lost in the Fire (Official Video)"</a>. Video is now on position <a>#1000</a>.',
      time: new Date(),
    },
    {
      message: '<a>@somePartyGoer1</a> liked your video <a>"Gesaffelstein & The Weeknd - Lost in the Fire (Official Video)"</a>. Video is now on position <a>#1000</a>.',
      time: new Date('June 12, 2022 14:27:03'),
    },
    {
      message: '<a>@someOtherPartyGoer2</a> added <a>"REZZ - Edge"</a> to the playlist. Video is on position <a>#2000</a>.',
      time: new Date('June 08, 2022 12:24:15'),
    },
    {
      message: '<a>@yetAnotherPartyGoer3</a> joined the party!',
      time: new Date('June 05, 2022 23:24:23'),
    },
    {
      message: '<a>@yetAnotherPartyGoer3</a> added <a>"Fantome - Pa??ii Mei (feat. Ioana Milculescu)"</a> to the playlist. Video is on position <a>#3000</a>.',
      time: new Date('June 01, 2022 03:24:33'),
    },
    {
      message: '<a>@yetAnotherPartyGoer3</a> added <a>"Fantome - Pa??ii Mei (feat. Ioana Milculescu)"</a> to the playlist. Video is on position <a>#3000</a>.',
      time: new Date('June 01, 2021 03:24:59'),
    },
    {
      message: '<a>@yetAnotherPartyGoer3</a> added <a>"Fantome - Pa??ii Mei (feat. Ioana Milculescu)"</a> to the playlist. Video is on position <a>#3000</a>.',
      time: new Date('Dec 31, 2020 03:24:00'),
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
    html = html.replaceAll('{time}', getTimeAgo(notifications[i].time));
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

const MINUTE = 60,
  HOUR = MINUTE * 60,
  DAY = HOUR * 24,
  YEAR = DAY * 365,
  DATE_FORMAT_NO_YEAR = {
    month: "short",
    weekday: 'short',
    day: "numeric",
    hour: 'numeric',
    hour12: true,
    minute: 'numeric',
    second: 'numeric'
  },
  DATE_FORMAT = {
    year: "numeric",
    month: "short",
    weekday: 'short',
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: 'numeric',
    second: 'numeric'
  };

function getTimeAgo(date) {
  const secondsAgo = Math.round((+new Date() - date) / 1000);

  if (secondsAgo < MINUTE) {
    return secondsAgo + "s ago";
  } else if (secondsAgo < HOUR) {
    return (Math.round((secondsAgo / MINUTE) * 10) / 10) + "m ago";
  } else if (secondsAgo < DAY) {
    return (Math.round((secondsAgo / HOUR) * 10) / 10) + "h ago";
  } else if (secondsAgo < YEAR) {
    return date.toLocaleString("default", DATE_FORMAT_NO_YEAR);
  } else {
    return date.toLocaleString("default", DATE_FORMAT);
  }
}
