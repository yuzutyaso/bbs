document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');

    // 使用するInvidiousインスタンスのリスト
    const invidiousInstances = [
        'https://rust.oskamp.nl/',
        'https://siawaseok-wakame-server2.glitch.me',
        'https://clover-pitch-position.glitch.me/',
        'https://inv.nadeko.net/',
        'https://iv.duti.dev/',
        'https://yewtu.be/',
        'https://id.420129.xyz/',
        'https://invidious.f5.si/',
        'https://invidious.nerdvpn.de/',
        'https://invidious.tiekoetter.com/',
        'https://lekker.gay/', // 重複がありますが、そのまま追加
        'https://nyc1.iv.ggtyler.dev/',
        'https://iv.ggtyler.dev/',
        'https://invid-api.poketube.fun/', // 'ttps://' を 'https://' に修正
        'https://iv.melmac.space/',
        'https://cal1.iv.ggtyler.dev/',
        'https://pol1.iv.ggtyler.dev/',
        'https://yt.artemislena.eu/',
        'https://invidious.lunivers.trade',
        'https://eu-proxy.poketube.fun',
        'https://invidious.reallyaweso.me',
        'https://invidious.dhusch.de',
        'https://usa-proxy2.poketube.fun',
        'https://invidious.darkness.service',
        'https://iv.datura.network',
        'https://invidious.private.coffee',
        'https://invidious.projectsegfau.lt',
        'https://invidious.perennialte.ch',
        'https://usa-proxy.poketube.fun/',
        'https://invidious.exma.de/',
        'https://invidious.einfachzocken.eu/',
        'https://inv.zzls.xyz/',
        'https://yt.yoc.ovh/',
        'https://invidious.adminforge.de',
        'https://invidious.catspeed.cc/',
        'https://inst1.inv.catspeed.cc/',
        'https://inst2.inv.catspeed.cc/',
        'https://materialious.nadeko.net/',
        'https://inv.us.projectsegfau.lt/',
        'https://invidious.qwik.space/',
        'https://invidious.jing.rocks/',
        'https://yt.thechangebook.org/',
        'https://vro.omcat.info/',
        'https://iv.nboeck.de/',
        'https://youtube.mosesmang.com/',
        'https://iteroni.com/',
        'https://subscriptions.gir.st/',
        'https://invidious.fdn.fr/',
        'https://inv.vern.cc/',
        'https://invi.susurrando.com/',
        'https://youtube.alt.tyil.nl/',
        'https://invidious.schenkel.eti.br/',
        'https://invidious.nikkosphere.com/'
        // 提供されたリスト内の重複はそのまま残してあります。
        // リストは適宜最新かつ安定したインスタンスに更新してください。
    ];

    /**
     * ランダムなInvidiousインスタンスURLを取得するヘルパー関数
     * @returns {string} - InvidiousインスタンスのベースURL
     */
    function getRandomInvidiousInstance() {
        const randomIndex = Math.floor(Math.random() * invidiousInstances.length);
        return invidiousInstances[randomIndex];
    }

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

    /**
     * APIリクエストをInvidiousインスタンスでラップし、失敗時にリトライする関数
     * @param {string} endpoint - APIエンドポイント (例: '/api/v1/trending')
     * @param {number} retries - リトライ回数
     * @returns {Promise<object>} - APIレスポンスデータ
     */
    async function fetchWithInvidiousFallback(endpoint, retries = 3) {
        for (let i = 0; i < retries; i++) {
            const instance = getRandomInvidiousInstance();
            const url = `${instance}${endpoint}`;
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                return data;
            } catch (error) {
                console.warn(`Invidiousインスタンス ${instance} からの取得に失敗しました (試行 ${i + 1}/${retries}):`, error);
                if (i === retries - 1) {
                    throw new Error('すべてのInvidiousインスタンスからの取得に失敗しました。');
                }
                // 短い遅延を挟んでからリトライ
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); 
            }
        }
    }
    
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
            const data = await fetchWithInvidiousFallback('/api/v1/trending?sort_by=views');
            
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
            const data = await fetchWithInvidiousFallback(`/api/v1/search?q=${encodeURIComponent(query)}`);

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
            // 動画のストリームURLはGlitch APIから取得
            const response = await fetch(`https://tarry-lucky-magician.glitch.me/api/${videoId}`);
            const data = await response.json();
            
            if (data) {
                videoPlayer.src = data.stream_url; // 初期ストリーム
                videoTitle.textContent = data.videoTitle;
                document.title = `${data.videoTitle} - 簡易YouTube`;
                channelImage.src = data.channelImage;
                channelName.textContent = data.channelName;
                channelName.href = `channel.html?channelId=${data.channelId}`;
                videoDescription.textContent = data.videoDes;
                videoViews.textContent = `${data.videoViews.toLocaleString()} 回視聴`;
                videoLikes.textContent = `${data.likeCount.toLocaleString()} いいね`;

                // 画質オプションを生成
                qualitySelect.innerHTML = ''; 
                if (data.streamUrls && data.streamUrls.length > 0) {
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
                        updateVideoSource(videoPlayer, qualitySelect.value, data.streamUrls);
                    }
                } else if (data.stream_url) {
                    // streamUrlsがない場合でも、stream_urlがあればデフォルトとして追加
                    const option = document.createElement('option');
                    option.value = 'default';
                    option.textContent = 'デフォルト';
                    qualitySelect.appendChild(option);
                    qualitySelect.value = 'default';
                    videoPlayer.src = data.stream_url; // デフォルトストリームを設定
                }


                // 画質変更イベントリスナー
                qualitySelect.addEventListener('change', () => {
                    updateVideoSource(videoPlayer, qualitySelect.value, data.streamUrls);
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
     * @param {string} selectedResolution - 選択された画質 (例: '1080p' or 'default')
     * @param {Array<object>} streamUrls - 利用可能なストリームURLの配列
     */
    function updateVideoSource(videoPlayer, selectedResolution, streamUrls) {
        let videoStreamUrl = '';
        
        if (selectedResolution === 'default') {
            const lowestResolutionStream = streamUrls.find(s => s.resolution === '144p'); 
            videoStreamUrl = lowestResolutionStream ? lowestResolutionStream.url : streamUrls[0]?.url;
        } else {
            const selectedStream = streamUrls.find(s => s.resolution === selectedResolution);
            if (selectedStream) {
                videoStreamUrl = selectedStream.url;
            } else {
                console.warn(`選択された画質 (${selectedResolution}) のストリームが見つかりません。`);
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
            const channelData = await fetchWithInvidiousFallback(`/api/v1/channels/${channelId}`);

            if (channelData) {
                channelTitle.textContent = channelData.channelName;
                document.title = `${channelData.channelName} - 簡易YouTube`;
                channelProfileImage.src = channelData.channelThumbnail?.[0]?.url || 'https://via.placeholder.com/80'; 
                
                if (channelData.channelBanner?.[0]?.url) {
                    channelBanner.src = channelData.channelBanner[0].url;
                    channelBanner.style.display = 'block';
                } else {
                    channelBanner.style.display = 'none';
                }

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
});
