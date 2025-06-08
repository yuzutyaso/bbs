// js/invidious-api.js

const INVIDIOUS_INSTANCE = 'https://pol1.iv.ggtyler.dev'; // Choose a reliable instance
// You can try other instances if this one has issues, e.g., 'https://vid.puffyan.us'

/**
 * Invidious APIとの対話のためのヘルパー関数群
 */
async function searchVideos(query) {
    try {
        const response = await fetch(`${INVIDIOUS_INSTANCE}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("動画の検索中にエラーが発生しました:", error);
        return [];
    }
}

async function getPopularVideos() {
    try {
        // Invidious APIには直接的な「人気動画」エンドポイントがない場合があります。
        // 代わりに、利用可能な場合はトレンド動画を取得します。
        // または、特定の人気チャンネルの動画を取得することも検討できます。
        const response = await fetch(`${INVIDIOUS_INSTANCE}/api/v1/trending?region=JP`);
        if (!response.ok) {
            // トレンドエンドポイントが利用できない場合のフォールバック
            console.warn("トレンド動画エンドポイントが利用できません。代替手段を検討してください。");
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("人気動画の取得中にエラーが発生しました:", error);
        return [];
    }
}

async function getVideoDetails(videoId) {
    try {
        const response = await fetch(`${INVIDIOUS_INSTANCE}/api/v1/videos/${videoId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("動画の詳細の取得中にエラーが発生しました:", error);
        return null;
    }
}

async function getChannelDetails(channelId) {
    try {
        const response = await fetch(`${INVIDIOUS_INSTANCE}/api/v1/channels/${channelId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("チャンネル詳細の取得中にエラーが発生しました:", error);
        return null;
    }
}

async function getChannelVideos(channelId) {
    try {
        const response = await fetch(`${INVIDIOUS_INSTANCE}/api/v1/channels/${channelId}/videos`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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
            <img src="${thumbnailUrl}" alt="${video.title}">
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
            const videos = await getPopularVideos();
            if (videos && videos.length > 0) {
                popularVideosGrid.innerHTML = ''; // 既存のコンテンツをクリア
                videos.slice(0, 10).forEach(video => { // 最大10件の人気動画を表示
                    popularVideosGrid.appendChild(createVideoCard(video));
                });
            } else {
                popularVideosGrid.innerHTML = '<p>人気動画を読み込めませんでした。Invidiousインスタンスを確認してください。</p>';
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
                const videos = await searchVideos(query);
                if (videos && videos.length > 0) {
                    searchResultsGrid.innerHTML = ''; // 既存のコンテンツをクリア
                    videos.forEach(video => {
                        searchResultsGrid.appendChild(createVideoCard(video));
                    });
                } else {
                    searchResultsGrid.innerHTML = '<p>検索結果が見つかりませんでした。</p>';
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

        if (videoId) {
            const videoDetails = await getVideoDetails(videoId);
            if (videoDetails) {
                if (videoTitlePage) videoTitlePage.textContent = `${videoDetails.title} - 簡易YouTube`;
                if (videoTitle) videoTitle.textContent = videoDetails.title;
                if (videoChannelLink) {
                    videoChannelLink.textContent = videoDetails.author;
                    videoChannelLink.href = `channel.html?c=${videoDetails.authorId}`;
                }
                if (videoDescription) videoDescription.textContent = videoDetails.description;

                // 画質オプションを populate
                if (qualitySelect && videoDetails.formatStreams) {
                    const qualityOptions = {};
                    videoDetails.formatStreams.forEach(stream => {
                        // オーディオストリームとビデオストリームの両方を含むURLに焦点を当てる
                        // そして、品質ラベルがあるもののみ
                        if (stream.url && stream.qualityLabel && stream.container !== 'm4a') { // m4aは通常オーディオのみ
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
                    sortedQualities.forEach(quality => {
                        const option = document.createElement('option');
                        option.value = qualityOptions[quality];
                        option.textContent = quality;
                        qualitySelect.appendChild(option);
                    });

                    // 利用可能な最高品質を初期ビデオソースとして設定
                    if (videoPlayer && sortedQualities.length > 0) {
                        videoPlayer.src = qualityOptions[sortedQualities[sortedQualities.length - 1]]; // 最高品質
                        qualitySelect.value = qualityOptions[sortedQualities[sortedQualities.length - 1]]; // ドロップダウンで選択
                    }

                    // 画質変更のハンドリング
                    qualitySelect.addEventListener('change', (event) => {
                        videoPlayer.src = event.target.value;
                        videoPlayer.load(); // 新しいソースでビデオをリロード
                    });
                } else if (videoPlayer) {
                     // qualitySelectが見つからないか、ストリームがない場合のフォールバック（例: 埋め込みプレイヤーなしの動画）
                    if (videoDetails.hlsUrl) { // HLSストリームがあればそれを試す
                        videoPlayer.src = videoDetails.hlsUrl;
                    } else if (videoDetails.formatStreams && videoDetails.formatStreams.length > 0) {
                        // 最初の利用可能なストリームURLを使用
                        videoPlayer.src = videoDetails.formatStreams[0].url;
                    } else {
                        videoPlayer.innerHTML = '<p>この動画の再生可能なストリームが見つかりませんでした。</p>';
                    }
                }


                // 関連動画をロード
                if (relatedVideosGrid && videoDetails.relatedVideos && videoDetails.relatedVideos.length > 0) {
                    relatedVideosGrid.innerHTML = ''; // 既存のコンテンツをクリア
                    videoDetails.relatedVideos.slice(0, 5).forEach(relatedVideo => { // 最大5件の関連動画を表示
                        relatedVideosGrid.appendChild(createVideoCard(relatedVideo));
                    });
                } else if (relatedVideosGrid) {
                    relatedVideosGrid.innerHTML = '<p>関連動画が見つかりませんでした。</p>';
                }

            } else if (videoTitle) {
                videoTitle.textContent = '動画が見つかりませんでした。';
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
            const channelDetails = await getChannelDetails(channelId);
            const channelVideos = await getChannelVideos(channelId);

            if (channelDetails) {
                if (channelTitlePage) channelTitlePage.textContent = `${channelDetails.author} - 簡易YouTube`;
                if (channelAvatar && channelDetails.authorThumbnails && channelDetails.authorThumbnails.length > 0) {
                    channelAvatar.src = channelDetails.authorThumbnails[0].url;
                } else if (channelAvatar) {
                    channelAvatar.src = 'https://via.placeholder.com/120x120?text=No+Avatar'; // Fallback
                }
                if (channelName) channelName.textContent = channelDetails.author;
                if (channelDescription) channelDescription.textContent = channelDetails.description || '説明はありません。';
                if (channelSubscribers) channelSubscribers.textContent = channelDetails.subCount || 'N/A';
            } else if (channelName) {
                channelName.textContent = 'チャンネルが見つかりませんでした。';
            }

            if (channelVideosGrid && channelVideos && channelVideos.length > 0) {
                channelVideosGrid.innerHTML = ''; // 既存のコンテンツをクリア
                channelVideos.forEach(video => {
                    channelVideosGrid.appendChild(createVideoCard(video));
                });
            } else if (channelVideosGrid) {
                channelVideosGrid.innerHTML = '<p>このチャンネルには動画がありません。</p>';
            }
        } else if (channelName) {
            channelName.textContent = 'チャンネルIDが指定されていません。';
        }
    }
});
