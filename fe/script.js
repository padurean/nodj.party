var state = {
  playlist: [],
  playlistIndexByVideoID: {},
  activeIndex: -1,
  pausedAt: 0
}

var topNavElem;
var topNavHamburgerElem;
var topNavLinksElem;
var addToPlaylistSectionElem;
var addToPlaylistInputElem;
var addToPlaylistBtnElem;
var addToPlaylistInProgressElem;
var addToPlaylistErrorElem;
var playlistElem;
var tracksElem;

var player;

window.addEventListener('load', (event) => {
  loadYouTubeIframeAPI();
  loadStaticElems();
  addOnSpaceKeyUpListener();
  topNavHamburgerElem.addEventListener('click', toggleTopNav);
  window.addEventListener('click', hideTopNav);
  addToPlaylistBtnElem.addEventListener('click', onAddToPlaylistBtnClick);
  addToPlaylistErrorElem.addEventListener('click', function (event) {
    this.classList.add('hidden');
    addToPlaylistSectionElem.classList.remove('hidden');
  });
  loadAndRenderPlaylist();
});

function addOnSpaceKeyUpListener() {
  document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
      playOrPause();
    }
  });
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
  setActiveItem(player.getVideoData()['video_id']);
}

// possible states (see them with console.log(YT.PlayerState)):
// BUFFERING: 3, CUED: 5, ENDED: 0, PAUSED: 2, PLAYING: 1, UNSTARTED: -1
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.UNSTARTED) {
    setActiveItem(player.getVideoData()['video_id']);
    return;
  }
  if (event.data == YT.PlayerState.PLAYING) {
    state.pausedAt = 0;
    return;
  }
  if (event.data == YT.PlayerState.PAUSED) {
    state.pausedAt = player.getCurrentTime();
    return;
  }
  if (event.data == YT.PlayerState.ENDED) {
    playNext();
    return;
  }
}

function setActiveItem(videoID) {
  var prevActiveIndex = state.activeIndex;
  var newActiveIndex = state.playlistIndexByVideoID[videoID];
  if (newActiveIndex === prevActiveIndex) {
    return;
  }

  state.activeIndex = newActiveIndex;

  highlightActiveItem();

  if (prevActiveIndex >= 0) {
    unhighlightItem(prevActiveIndex);
  }
}

function highlightActiveItem() {
  if (state.activeIndex < 0) {
    return;
  }
  var itemElem = document.getElementById('item-' + state.activeIndex);
  itemElem.classList.add('active');
}

function unhighlightItem(index) {
  var itemElem = document.getElementById('item-' + index);
  itemElem.classList.remove('active');
}

function playNext() {
  if (state.activeIndex === state.playlist.length - 1) {
    return;
  }
  player.loadVideoById(state.playlist[state.activeIndex + 1].videoID);
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
  topNavElem = document.getElementById('top-nav');
  topNavHamburgerElem = document.getElementById('top-nav-hamburger');
  topNavLinksElem = document.getElementById('top-nav-links');
  addToPlaylistSectionElem = document.getElementById('add');
  addToPlaylistInputElem = document.getElementById('add-to-playlist-input');
  addToPlaylistBtnElem = document.getElementById('add-to-playlist-btn');
  addToPlaylistInProgressElem = document.getElementById('add-in-progress');
  addToPlaylistErrorElem = document.getElementById('add-error');
  playlistElem = document.getElementById('playlist');
  tracksElem = document.getElementById('items');
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

function onAddToPlaylistBtnClick(event) {
  event.preventDefault();
  var youTubeVideoURL = addToPlaylistInputElem.value.trim();
  if (!youTubeVideoURL) {
    return;
  }
  youTubeVideoURL = 'https://noembed.com/embed?url=' + youTubeVideoURL;
  addToPlaylistSectionElem.classList.add('hidden');
  addToPlaylistInProgressElem.classList.remove('hidden');
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
      return
    }
    var videoID = videoIDFromURL(json.url);
    state.playlist.push(
      {
        videoID: videoID,
        url: json.url,
        thumbnail: json.thumbnail_url,
        title: json.title,
        user: 'someCurrentUsername',
        rank: (state.playlist.length + 1) * 1000,
        likes: 0
      }
    );
    state.playlistIndexByVideoID[videoID] = state.playlist.length - 1;
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
  state.playlist = [
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
  ];

  for (var i = 0; i < state.playlist.length; i++) {
    state.playlist[i].videoID = videoIDFromURL(state.playlist[i].url);
    state.playlistIndexByVideoID[state.playlist[i].videoID] = i;
  }


  renderPlaylist();
}

function toHTMLEntities(str) {
  return str.replace(/./gm, function (s) {
    return (s.match(/[a-z0-9\s]+/i)) ? s : '&#' + s.charCodeAt(0) + ';';
  });
};

function renderPlaylist() {
  var templateElem = document.getElementById('playlist-item-template');

  tracksElem.innerHTML = '';
  for (var i = 0; i < state.playlist.length; i++) {
    var html = templateElem.innerHTML.replaceAll('{index}', i);
    html = html.replaceAll('{thumbnail}', state.playlist[i].thumbnail);
    html = html.replaceAll('{title}', toHTMLEntities(state.playlist[i].title));
    html = html.replaceAll('{user}', state.playlist[i].user);
    html = html.replaceAll('{rank}', state.playlist[i].rank);
    html = html.replaceAll('{likes}', state.playlist[i].likes);
    tracksElem.innerHTML += html;
  }

  var tracksElems = tracksElem.getElementsByClassName('item');
  for (var i = 0; i < tracksElems.length; i++) {
    var trackImgElem = tracksElems[i].getElementsByTagName('img')[0]
    trackImgElem.addEventListener('click', onTrackClick);
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
  var clickedVideoID = state.playlist[trackIndex].videoID;
  var playerVideoID = player.getVideoData()['video_id'];
  // clicked video is different than video in player
  if (playerVideoID !== clickedVideoID) {
    player.loadVideoById(state.playlist[trackIndex].videoID);
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
