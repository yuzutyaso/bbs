document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput.value;
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        });
    }

    // パスに基づいて異なるページをロード
    const path = window.location.pathname;

    if (path.includes('search.html')) {
        loadSearchResults();
    } else if (path.includes('watch.html')) {
        loadVideoPlayer();
    } else if (path.includes('channel.html')) {
        loadChannelPage();
    } else {
        loadPopularVideos();
    }
});

/**
 * 動画アイテムのHTMLを生成するヘルパー関数
 * @param {object} video - 動画データ
 * @returns {string} - 生成されたHTML文字列
 */
function createVideoItemHtml(video) {
    const videoId = video.videoId || video.id; // APIによってキーが異なる場合がある
    const title = video.videoTitle || video.title;
    const author = video.channelName || video.author;
    const views = video.videoViews || video.views;

    return `
        <div class="video-item">
            <a href="watch.html?v=${videoId}">
                <img src="https://i.ytimg.com/vi/${videoId}/mqdefault.jpg" alt="${title}">
                <div class="video-item-details">
                    <h4>${title}</h4>
                    <p>${author}</p>
                    <p>${views ? `${views.toLocaleString()} 回視聴` : ''}</p>
                </div>
            </a>
        </div>
    `;
}

/**
 * Home Page: 人気動画をロードする
 */
async function loadPopularVideos() {
    const popularVideosContainer = document.getElementById('popular-videos');
    if (!popularVideosContainer) return;

    try {
        const response = await fetch('https://invidious.sethforprivacy.com/api/v1/trending?sort_by=views'); // Invidiousインスタンスは適宜変更
        const data = await response.json();
        
        popularVideosContainer.innerHTML = data.map(video => createVideoItemHtml(video)).join('');
    } catch (error) {
        console.error('人気動画の取得中にエラーが発生しました:', error);
        popularVideosContainer.innerHTML = '<p>人気動画の読み込みに失敗しました。</p>';
    }
}

/**
 * Search Results Page: 検索結果をロードする
 */
async function loadSearchResults() {
    const searchResultsContainer = document.getElementById('search-results');
    const searchQueryDisplay = document.getElementById('search-query-display');
    if (!searchResultsContainer || !searchQueryDisplay) return;

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');

    if (!query) {
        searchResultsContainer.innerHTML = '<p>検索クエリが指定されていません。</p>';
        return;
    }

    searchQueryDisplay.textContent = decodeURIComponent(query);
    document.title = `検索結果: ${decodeURIComponent(query)} - 簡易YouTube`;

    try {
        const response = await fetch(`https://invidious.sethforprivacy.com/api/v1/search?q=${encodeURIComponent(query)}`); // Invidiousインスタンスは適宜変更
        const data = await response.json();

        if (data.length > 0) {
            searchResultsContainer.innerHTML = data.filter(item => item.type === 'video').map(video => createVideoItemHtml(video)).join('');
        } else {
            searchResultsContainer.innerHTML = '<p>検索結果が見つかりませんでした。</p>';
        }
    } catch (error) {
        console.error('検索結果の取得中にエラーが発生しました:', error);
        searchResultsContainer.innerHTML = '<p>検索結果の読み込みに失敗しました。</p>';
    }
}

/**
 * Video Play Page: 動画プレイヤーと詳細をロードする
 */
async function loadVideoPlayer() {
    const videoPlayer = document.getElementById('video-player');
    const videoTitle = document.getElementById('video-title');
    const channelImage = document.getElementById('channel-image');
    const channelName = document.getElementById('channel-name');
    const videoDescription = document.getElementById('video-description');
    const videoViews = document.getElementById('video-views');
    const videoLikes = document.getElementById('video-likes');
    const qualitySelect = document.getElementById('quality-select');

    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v');

    if (!videoId) {
        if (videoTitle) videoTitle.textContent = '動画IDが指定されていません。';
        return;
    }

    try {
        const response = await fetch(`https://tarry-lucky-magician.glitch.me/api/${videoId}`);
        const data = await response.json();
        
        if (data) {
            videoPlayer.src = data.stream_url;
            videoTitle.textContent = data.videoTitle;
            document.title = `${data.videoTitle} - 簡易YouTube`;
            channelImage.src = data.channelImage;
            channelName.textContent = data.channelName;
            channelName.href = `channel.html?channelId=${data.channelId}`;
            videoDescription.textContent = data.videoDes;
            videoViews.textContent = `${data.videoViews.toLocaleString()} 回視聴`;
            videoLikes.textContent = `${data.likeCount.toLocaleString()} いいね`;

            // 画質オプションを生成
            qualitySelect.innerHTML = ''; // 既存のオプションをクリア
            if (data.streamUrls && data.streamUrls.length > 0) {
                // streamUrlsからresolutionが存在するもののみを抽出し、重複を排除してソート
                const uniqueResolutions = Array.from(new Set(
                    data.streamUrls.filter(s => s.resolution)
                                  .map(s => s.resolution)
                )).sort((a, b) => {
                    const resA = parseInt(a.replace('p', ''));
                    const resB = parseInt(b.replace('p', ''));
                    return resA - resB;
                });

                uniqueResolutions.forEach(res => {
                    const option = document.createElement('option');
                    option.value = res;
                    option.textContent = res;
                    qualitySelect.appendChild(option);
                });

                // デフォルトで最高画質を選択
                if (uniqueResolutions.length > 0) {
                    qualitySelect.value = uniqueResolutions[uniqueResolutions.length - 1];
                    updateVideoSource(videoPlayer, qualitySelect.value, data.streamUrls, data.audioUrl);
                }
            } else if (data.stream_url) {
                // デフォルトのstream_urlがある場合はそれを使用
                const option = document.createElement('option');
                option.value = 'default';
                option.textContent = 'デフォルト';
                qualitySelect.appendChild(option);
                qualitySelect.value = 'default';
            }


            // 画質変更イベントリスナー
            qualitySelect.addEventListener('change', () => {
                updateVideoSource(videoPlayer, qualitySelect.value, data.streamUrls, data.audioUrl);
            });

        } else {
            if (videoTitle) videoTitle.textContent = '動画情報の取得に失敗しました。';
        }
    } catch (error) {
        console.error('動画情報の取得中にエラーが発生しました:', error);
        if (videoTitle) videoTitle.textContent = '動画の読み込みに失敗しました。';
    }
}

/**
 * 動画プレイヤーのソースを更新する関数
 * @param {HTMLVideoElement} videoPlayer - video要素
 * @param {string} selectedResolution - 選択された画質 (例: '1080p')
 * @param {Array<object>} streamUrls - 利用可能なストリームURLの配列
 * @param {string} audioUrl - 独立したオーディオURL
 */
function updateVideoSource(videoPlayer, selectedResolution, streamUrls, audioUrl) {
    let videoStreamUrl = '';
    
    if (selectedResolution === 'default' && streamUrls.length === 0 && audioUrl) {
        // stream_urlのみでqualitySelectにdefaultが選択されている場合
        // このロジックは、Glitch APIがstream_urlを直接提供する場合に機能します
        // ただし、Glitch APIのstream_urlは最高画質とは限らないため、qualitySelectを使う方が良い
        // 今回のサンプルデータでは`stream_url`が動画本体のURLで、`highstreamUrl`が最高画質と解釈できる
        // ここでは、streamUrlsが提供されている場合はそれらを優先する
        const defaultStream = streamUrls.find(s => s.resolution === '480p'); // 例として480pをデフォルトとすることも可能
        videoStreamUrl = defaultStream ? defaultStream.url : '';
    } else {
        const selectedStream = streamUrls.find(s => s.resolution === selectedResolution);
        if (selectedStream) {
            videoStreamUrl = selectedStream.url;
        } else {
            console.warn(`選択された画質 (${selectedResolution}) のストリームが見つかりません。`);
            // 見つからない場合は、最も近いまたはデフォルトの画質を試す
            // 例えば、元のstream_urlを使うなど
            // videoPlayer.src = data.stream_url;
            return; 
        }
    }

    if (videoStreamUrl) {
        videoPlayer.src = videoStreamUrl;
        videoPlayer.play();
    } else {
        console.error('動画ソースを更新できませんでした: 有効なURLが見つかりません。');
    }
}


/**
 * Channel Page: チャンネル情報と最新動画をロードする
 */
async function loadChannelPage() {
    const channelBanner = document.getElementById('channel-banner');
    const channelProfileImage = document.getElementById('channel-profile-image');
    const channelTitle = document.getElementById('channel-title');
    const channelVideosContainer = document.getElementById('channel-videos');
    if (!channelBanner || !channelProfileImage || !channelTitle || !channelVideosContainer) return;

    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channelId');

    if (!channelId) {
        channelTitle.textContent = 'チャンネルIDが指定されていません。';
        return;
    }

    try {
        // チャンネル情報と動画の取得
        const channelResponse = await fetch(`https://invidious.sethforprivacy.com/api/v1/channels/${channelId}`); // Invidiousインスタンスは適宜変更
        const channelData = await channelResponse.json();

        if (channelData) {
            channelTitle.textContent = channelData.channelName;
            document.title = `${channelData.channelName} - 簡易YouTube`;
            channelProfileImage.src = channelData.channelThumbnail?.[0]?.url || 'https://via.placeholder.com/80'; // チャンネルアイコン
            
            // バナー画像はInvidious APIで直接取得できない場合が多いので、存在しない場合は非表示
            if (channelData.channelBanner?.[0]?.url) {
                channelBanner.src = channelData.channelBanner[0].url;
                channelBanner.style.display = 'block';
            } else {
                channelBanner.style.display = 'none';
            }

            // 最新動画の取得 (Invidious APIの`videos`はチャンネルの動画リスト)
            if (channelData.latestVideos && channelData.latestVideos.length > 0) {
                channelVideosContainer.innerHTML = channelData.latestVideos.map(video => createVideoItemHtml(video)).join('');
            } else {
                channelVideosContainer.innerHTML = '<p>このチャンネルには動画がありません。</p>';
            }
        } else {
            channelTitle.textContent = 'チャンネル情報の取得に失敗しました。';
        }
    } catch (error) {
        console.error('チャンネル情報の取得中にエラーが発生しました:', error);
        channelTitle.textContent = 'チャンネルの読み込みに失敗しました。';
    }
                                                          }
