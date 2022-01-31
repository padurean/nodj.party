var state = {
  playlist: []
}

var topNavHamburger;
var topNavLinks;
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
  topNavHamburger.addEventListener('click', toggleTopNav);
  addToPlaylistBtnElem.addEventListener('click', onAddToPlaylistBtnClick);
  addToPlaylistErrorElem.addEventListener('click', function(event) {
    this.classList.add('hidden');
    addToPlaylistSectionElem.classList.remove('hidden');
  });
  loadAndRenderPlaylist();
});

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
}

// var done = false;
function onPlayerStateChange(event) {
  // if (event.data == YT.PlayerState.PLAYING && !done) {
  //   setTimeout(stopVideo, 6000);
  //   done = true;
  // }
  if (event.data == YT.PlayerState.ENDED) {
    player.loadVideoById('JXgV1rXUoME');
  }
}

function stopVideo() {
  player.stopVideo();
}
//<=== YouTube iFrame API

function loadStaticElems() {
  topNavLinks = document.getElementById('top-nav-links');
  topNavHamburger = document.getElementById('top-nav-hamburger');
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
  topNavHamburger.classList.toggle('active');
  topNavLinks.classList.toggle('hidden');
}

function onAddToPlaylistBtnClick(event) {
  event.preventDefault();
  var youTubeVideoURL = addToPlaylistInputElem.value.trim();
  if (!youTubeVideoURL) {
    return;
  }
  youTubeVideoURL = 'https://noembed.com/embed?url='+youTubeVideoURL;
  addToPlaylistSectionElem.classList.add('hidden');
  addToPlaylistInProgressElem.classList.remove('hidden');
  fetch(youTubeVideoURL).then(function (response) {
    return response.json();
  }).then(function (json) {
    addToPlaylistInProgressElem.classList.add('hidden');
    if (json.error) {
      console.error('Add to playlist failed:', json.error);
      addToPlaylistErrorElem.innerText = 'Add to playlist failed :(';
      addToPlaylistErrorElem.classList.remove('hidden');
      return
    }
    state.playlist.push(
      {
      url: json.url,
      thumbnail: json.thumbnail_url,
      title: json.title,
      user: 'someCurrentUsername',
      rank: 1,
      likes: 0
    }
    );
    renderPlaylist();
    addToPlaylistInputElem.value = '';
    addToPlaylistSectionElem.classList.remove('hidden');
    // console.log('noembed response:', json);
  }).catch(function (err) {
    console.error('Error fetching video', youTubeVideoURL, err);
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
      rank: 2,
      likes: 10
    },
    {
      url: 'https://www.youtube.com/watch?v=DNhDh3xKwOo',
      thumbnail: 'http://img.youtube.com/vi/DNhDh3xKwOo/0.jpg',
      title: 'Fantome - Pașii Mei (feat. Ioana Milculescu)',
      user: 'yetAnotherPartyGoer3',
      rank: 3,
      likes: 0
    }
  ];
  renderPlaylist();
}

function toHTMLEntities(str) {
  return str.replace(/./gm, function(s) {
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
  for (var i=0; i < tracksElems.length; i++) {
    var trackImgElem = tracksElems[i].getElementsByTagName('img')[0]
    trackImgElem.addEventListener('click', onTrackClick);
  }
}

function onTrackClick(event) {
  var elem = event.target;
  if (elem !== this) {
    elem = elem.parentElement;
  }
  var trackIndex = elem.parentElement.getElementsByTagName('input')[0].value;
  const urlAndQueryparams = state.playlist[trackIndex].url.split('?');
  var videoID;
  if (urlAndQueryparams.length > 1) {
    const urlSearchParams = new URLSearchParams(urlAndQueryparams[1]);
    videoID = urlSearchParams.get('v');
  } else {
    const urlPieces = state.playlist[trackIndex].url.split('?')[0].split('/');
    videoID = urlPieces[urlPieces.length - 1];
  }
  player.loadVideoById(videoID);
}
