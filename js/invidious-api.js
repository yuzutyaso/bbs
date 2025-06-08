// js/invidious-api.js

const INVIDIOUS_INSTANCES = [
    'https://rust.oskamp.nl/',
    'https://siawaseok-wakame-server2.glitch.me/',
    'https://clover-pitch-position.glitch.me/',
    'https://inv.nadeko.net/',
    'https://iv.duti.dev/',
    'https://yewtu.be/',
    'https://id.420129.xyz/',
    'https://invidious.f5.si/',
    'https://invidious.nerdvpn.de/',
    'https://invidious.tiekoetter.com/',
    'https://lekker.gay/',
    'https://nyc1.iv.ggtyler.dev/',
    'https://iv.ggtyler.dev/',
    'https://invid-api.poketube.fun/',
    'https://iv.melmac.space/',
    'https://cal1.iv.ggtyler.dev/',
    'https://pol1.iv.ggtyler.dev/',
    'https://yt.artemislena.eu/',
    'https://invidious.lunivers.trade/',
    'https://eu-proxy.poketube.fun/',
    'https://invidious.reallyaweso.me/',
    'https://invidious.dhusch.de/',
    'https://usa-proxy2.poketube.fun/',
    'https://invidious.darkness.service/',
    'https://iv.datura.network/',
    'https://invidious.private.coffee/',
    'https://invidious.projectsegfau.lt/',
    'https://invidious.perennialte.ch/',
    'https://usa-proxy.poketube.fun/',
    'https://invidious.exma.de/',
    'https://invidious.einfachzocken.eu/',
    'https://inv.zzls.xyz/',
    'https://yt.yoc.ovh/',
    'https://invidious.adminforge.de/',
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
];

/**
 * 複数のInvidiousインスタンスを順番に試行してAPIリクエストを実行する関数。
 * 最初の成功したレスポンスを返します。
 * @param {string} endpoint - Invidious APIのエンドポイント（例: 'api/v1/search?q=query'）
 * @returns {Promise<Response>} APIレスポンスオブジェクト
 * @throws {Error} すべてのインスタンスが失敗した場合
 */
async function fetchWithFallback(endpoint) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            // 末尾のスラッシュの有無を考慮してURLを構築
            const baseUrl = instance.endsWith('/') ? instance : `${instance}/`;
            const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
            console.log(`Trying Invidious instance: ${url}`);
            const response = await fetch(url);
            if (response.ok) {
                console.log(`Successfully fetched from: ${instance}`);
                return response;
            } else {
                console.warn(`Instance ${instance} returned status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error with instance ${instance}:`, error);
        }
    }
    throw new Error("すべてのInvidiousインスタンスからのデータ取得に失敗しました。");
}

/**
 * Invidious APIとの対話のためのヘルパー関数群
 */
async function searchVideos(query) {
    try {
        const response = await fetchWithFallback(`api/v1/search?q=${encodeURIComponent(query)}&type=video`);
        return await response.json();
    } catch (error) {
        console.error("動画の検索中にエラーが発生しました:", error);
        return [];
    }
}

async function getPopularVideos() {
    try {
        const response = await fetchWithFallback(`api/v1/trending`);
        return await response.json();
    } catch (error) {
        console.error("人気動画の取得中にエラーが発生しました:", error);
        return [];
    }
}

async function getVideoDetails(videoId) {
    try {
        const response = await fetchWithFallback(`api/v1/videos/${videoId}`);
        return await response.json();
    } catch (error) {
        console.error("動画の詳細の取得中にエラーが発生しました:", error);
        return null;
    }
}

async function getChannelDetails(channelId) {
    try {
        const response = await fetchWithFallback(`api/v1/channels/${channelId}`);
        return await response.json();
    } catch (error) {
        console.error("チャンネル詳細の取得中にエラーが発生しました:", error);
        return null;
    }
}

async function getChannelVideos(channelId) {
    try {
        const response = await fetchWithFallback(`api/v1/channels/${channelId}/videos`);
        return await response.json();
    } catch (error) {
        console.error("チャンネル動画の取得中にエラーが発生しました:", error);
        return [];
    }
}

/**
 * 共通UI要素のヘルパー関数
 */
function createVideoCard(video) {
    const videoCard = document.createElement('div');
    videoCard.classList.add('video-card');
    const thumbnailUrl = video.videoThumbnails && video.videoThumbnails.length > 0
        ? video.videoThumbnails[0].url
        : 'https://via.placeholder.com/250x180?text=No+Image'; // Fallback image

    const authorLink = video.authorId
        ? `<p><a href="channel.html?c=${video.authorId}">${video.author}</a></p>`
        : `<p>${video.author || '不明なチャンネル'}</p>`;

    videoCard.innerHTML = `
        <a href="video.html?v=${video.videoId}">
            <img src="${thumbnailUrl}" alt="${video.title}" loading="lazy">
            <h3>${video.title}</h3>
            ${authorLink}
        </a>
    `;
    return videoCard;
}

function handleSearchSubmission(searchInputId, targetPage = 'search.html') {
    const searchInput = document.getElementById(searchInputId);
    if (searchInput) {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `${targetPage}?q=${encodeURIComponent(query)}`;
        }
    }
}

/**
 * 各ページのDOMContentLoadedイベントリスナー
 */
document.addEventListener('DOMContentLoaded', async () => {
    // ページ共通の検索バーイベントリスナー
    const headerSearchForm = document.getElementById('search-form-header');
    if (headerSearchForm) {
        headerSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            handleSearchSubmission('search-input-header');
        });
    }

    const path = window.location.pathname;

    // --- ホームページ (`index.html`) のロジック ---
    if (path.includes('index.html') || path === '/') {
        const searchForm = document.getElementById('search-form');
        const popularVideosGrid = document.getElementById('popular-videos-grid');

        if (searchForm) {
            searchForm.addEventListener('submit', (event) => {
                event.preventDefault();
                handleSearchSubmission('search-input');
            });
        }

        if (popularVideosGrid) {
            popularVideosGrid.innerHTML = '<p>人気動画を読み込み中...</p>'; // ローディング表示
            const videos = await getPopularVideos();
            if (videos && videos.length > 0) {
                popularVideosGrid.innerHTML = ''; // 既存のコンテンツをクリア
                videos.slice(0, 10).forEach(video => { // 最大10件の人気動画を表示
                    popularVideosGrid.appendChild(createVideoCard(video));
                });
            } else {
                popularVideosGrid.innerHTML = '<p>人気動画を読み込めませんでした。すべてのInvidiousインスタンスが利用できないか、データがありません。</p>';
            }
        }
    }

    // --- 検索結果ページ (`search.html`) のロジック ---
    if (path.includes('search.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        const searchQueryDisplay = document.getElementById('search-query-display');
        const searchResultsGrid = document.getElementById('search-results-grid');
        const searchInputHeader = document.getElementById('search-input-header');

        if (query) {
            if (searchQueryDisplay) searchQueryDisplay.textContent = query;
            if (searchInputHeader) searchInputHeader.value = query; // ヘッダー検索バーにクエリを設定

            if (searchResultsGrid) {
                searchResultsGrid.innerHTML = '<p>検索結果を読み込み中...</p>'; // ローディング表示
                const videos = await searchVideos(query);
                if (videos && videos.length > 0) {
                    searchResultsGrid.innerHTML = ''; // 既存のコンテンツをクリア
                    videos.forEach(video => {
                        searchResultsGrid.appendChild(createVideoCard(video));
                    });
                } else {
                    searchResultsGrid.innerHTML = '<p>検索結果が見つかりませんでした。すべてのInvidiousインスタンスが利用できないか、データがありません。</p>';
                }
            }
        } else if (searchResultsGrid) {
            searchResultsGrid.innerHTML = '<p>検索クエリが指定されていません。</p>';
        }
    }

    // --- 個別動画ページ (`video.html`) のロジック ---
    if (path.includes('video.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('v');
        const videoTitlePage = document.getElementById('video-title-page');
        const videoTitle = document.getElementById('video-title');
        const videoPlayer = document.getElementById('video-player');
        const videoChannelLink = document.getElementById('video-channel-link');
        const videoDescription = document.getElementById('video-description');
        const qualitySelect = document.getElementById('quality-select');
        const relatedVideosGrid = document.getElementById('related-videos-grid');

        // 動画詳細情報を表示するための要素 (video.htmlでこれらのIDが設定されていることを確認してください)
        const videoViewCount = document.getElementById('video-view-count');
        const videoPublishedDate = document.getElementById('video-published-date');
        const videoLikes = document.getElementById('video-likes');
        const videoDislikes = document.getElementById('video-dislikes');


        if (videoId) {
            if (videoTitle) videoTitle.textContent = '動画情報を読み込み中...'; // ローディング表示
            const videoDetails = await getVideoDetails(videoId);
            if (videoDetails) {
                if (videoTitlePage) videoTitlePage.textContent = `${videoDetails.title} - 簡易YouTube`;
                if (videoTitle) videoTitle.textContent = videoDetails.title;
                if (videoChannelLink) {
                    videoChannelLink.textContent = videoDetails.author;
                    videoChannelLink.href = `channel.html?c=${videoDetails.authorId}`;
                }
                if (videoDescription) videoDescription.textContent = videoDetails.description;

                // 新しい動画詳細要素にデータを設定
                if (videoViewCount) {
                    videoViewCount.textContent = videoDetails.viewCount ? videoDetails.viewCount.toLocaleString() + '回視聴' : 'N/A';
                }
                if (videoPublishedDate) {
                    videoPublishedDate.textContent = videoDetails.publishedText || 'N/A';
                }
                if (videoLikes) {
                    videoLikes.textContent = videoDetails.likeCount ? videoDetails.likeCount.toLocaleString() : 'N/A';
                }
                if (videoDislikes) {
                    // Invidious APIではdislikeCountが0の場合も`null`ではなく`0`が返されることが多いですが、
                    // 不確実な場合はフォールバックを設定するのが安全です。
                    videoDislikes.textContent = (videoDetails.dislikeCount !== null && videoDetails.dislikeCount !== undefined) ? videoDetails.dislikeCount.toLocaleString() : 'N/A';
                }


                // 画質オプションを populate
                if (qualitySelect && videoDetails.formatStreams) {
                    const qualityOptions = {};
                    videoDetails.formatStreams.forEach(stream => {
                        // オーディオストリームとビデオストリームの両方を含むURLに焦点を当てる
                        // そして、品質ラベルがあるもののみ (m4aは通常オーディオのみ)
                        if (stream.url && stream.qualityLabel && stream.container !== 'm4a') {
                            qualityOptions[stream.qualityLabel] = stream.url;
                        }
                    });

                    // より良い表示のために画質をソート（例: 360p, 480p, 720p, 1080p）
                    const sortedQualities = Object.keys(qualityOptions).sort((a, b) => {
                        const qualityA = parseInt(a.replace('p', ''));
                        const qualityB = parseInt(b.replace('p', ''));
                        return qualityA - qualityB;
                    });

                    // ドロップダウンをクリア
                    qualitySelect.innerHTML = '';
                    if (sortedQualities.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = '利用可能な画質なし';
                        option.disabled = true;
                        qualitySelect.appendChild(option);
                    } else {
                        // 最高品質をデフォルトで選択肢の先頭に持ってくるか、利用可能な最高品質を初期設定する
                        // 例: 最高品質を最初に
                        sortedQualities.reverse().forEach(quality => { // 降順にソートして追加
                            const option = document.createElement('option');
                            option.value = qualityOptions[quality];
                            option.textContent = quality;
                            qualitySelect.appendChild(option);
                        });

                        // 利用可能な最高品質を初期ビデオソースとして設定
                        // sortedQualitiesは既に降順なので、最初の要素が最高品質
                        if (videoPlayer) {
                            videoPlayer.src = qualityOptions[sortedQualities[0]];
                            qualitySelect.value = qualityOptions[sortedQualities[0]];
                        }
                    }

                    // 画質変更のハンドリング
                    if (videoPlayer) { // videoPlayerが存在することを確認
                        qualitySelect.addEventListener('change', (event) => {
                            videoPlayer.src = event.target.value;
                            videoPlayer.load(); // 新しいソースでビデオをリロード
                        });
                    }
                } else if (videoPlayer) {
                     // qualitySelectが見つからないか、ストリームがない場合のフォールバック
                    if (videoDetails.hlsUrl) { // HLSストリームがあればそれを試す
                        videoPlayer.src = videoDetails.hlsUrl;
                    } else if (videoDetails.formatStreams && videoDetails.formatStreams.length > 0) {
                        // 最初の利用可能なストリームURLを使用 (ベストエフォート)
                        videoPlayer.src = videoDetails.formatStreams[0].url;
                    } else {
                        videoPlayer.innerHTML = '<p>この動画の再生可能なストリームが見つかりませんでした。</p>';
                    }
                }


                // 関連動画をロード
                if (relatedVideosGrid) {
                    if (videoDetails.relatedVideos && videoDetails.relatedVideos.length > 0) {
                        relatedVideosGrid.innerHTML = ''; // 既存のコンテンツをクリア
                        // スケルトンスクリーンを適用する場合、ここでplaceholdersをレンダリングし、
                        // データロード後に実際のコンテンツに置き換えることができます。
                        videoDetails.relatedVideos.slice(0, 5).forEach(relatedVideo => { // 最大5件の関連動画を表示
                            relatedVideosGrid.appendChild(createVideoCard(relatedVideo));
                        });
                    } else {
                        relatedVideosGrid.innerHTML = '<p>関連動画が見つかりませんでした。</p>';
                    }
                }

            } else if (videoTitle) {
                videoTitle.textContent = '動画が見つかりませんでした。すべてのInvidiousインスタンスが利用できないか、動画が存在しません。';
            }
        } else if (videoTitle) {
            videoTitle.textContent = '動画IDが指定されていません。';
        }
    }

    // --- チャンネルページ (`channel.html`) のロジック ---
    if (path.includes('channel.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const channelId = urlParams.get('c');
        const channelTitlePage = document.getElementById('channel-title-page');
        const channelAvatar = document.getElementById('channel-avatar');
        const channelName = document.getElementById('channel-name');
        const channelDescription = document.getElementById('channel-description');
        const channelSubscribers = document.getElementById('channel-subscribers');
        const channelVideosGrid = document.getElementById('channel-videos-grid');

        if (channelId) {
            if (channelName) channelName.textContent = 'チャンネル情報を読み込み中...'; // ローディング表示
            const channelDetails = await getChannelDetails(channelId);
            const channelVideos = await getChannelVideos(channelId);

            if (channelDetails) {
                if (channelTitlePage) channelTitlePage.textContent = `${channelDetails.author} - 簡易YouTube`;
                if (channelAvatar && channelDetails.authorThumbnails && channelDetails.authorThumbnails.length > 0) {
                    // 適切なサイズのサムネイルを選択することも可能
                    channelAvatar.src = channelDetails.authorThumbnails[0].url;
                } else if (channelAvatar) {
                    channelAvatar.src = 'https://via.placeholder.com/120x120?text=No+Avatar'; // Fallback
                }
                if (channelName) channelName.textContent = channelDetails.author;
                if (channelDescription) channelDescription.textContent = channelDetails.description || '説明はありません。';
                if (channelSubscribers) channelSubscribers.textContent = channelDetails.subCount ? channelDetails.subCount.toLocaleString() + '人' : 'N/A';
            } else if (channelName) {
                channelName.textContent = 'チャンネルが見つかりませんでした。すべてのInvidiousインスタンスが利用できないか、チャンネルが存在しません。';
            }

            if (channelVideosGrid) {
                if (channelVideos && channelVideos.length > 0) {
                    channelVideosGrid.innerHTML = ''; // 既存のコンテンツをクリア
                    channelVideos.forEach(video => {
                        channelVideosGrid.appendChild(createVideoCard(video));
                    });
                } else {
                    channelVideosGrid.innerHTML = '<p>このチャンネルには動画がありません。</p>';
                }
            }
        } else if (channelName) {
            channelName.textContent = 'チャンネルIDが指定されていません。';
        }
    }
});
