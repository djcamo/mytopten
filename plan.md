Implementation Plan: Spotify Playlist Import

  Objective
  Enable users to import their Spotify playlists into "My Top Ten" by connecting their Spotify account, selecting a playlist, and automatically saving the tracks.

  Proposed Changes

  1. Update Authentication Scopes
  Ensure all Spotify login buttons request the necessary permissions to read user playlists.

  Files: public/scripts/scripts.js, src/pages/login.astro, src/pages/create_account.astro

   1 // Change in signInWithSpotify logic:
   2 const { data, error } = await supabaseClient.auth.signInWithOAuth({
   3     provider: 'spotify',
   4     options: {
   5         scopes: 'playlist-read-private playlist-read-collaborative'
   6     }
   7 });

  2. UI: Spotify Import Modal
  Add a modal and styles to the playlist page.

  File: src/pages/playlist.astro

    1 <!-- Add this before the closing </section> -->
     <div id="spotifyModal" class="modal-overlay" style="display:none;">
         <div class="modal-content">
             <div class="modal-header">
                 <h3>Import from Spotify</h3>
                 <button id="closeSpotifyModal" class="btn-close">&times;</button>
             </div>
             <div id="spotifyModalBody" class="modal-body">
                 <div id="spotifyLoading" style="display:none;">Loading playlists...</div>
                <div id="spotifyConnect" style="display:none;">
                    <p>Please connect your Spotify account to see your playlists.</p>
                    <button id="reconnectSpotify" class="btn btn-primary">Connect Spotify</button>
                </div>
                <div id="spotifyPlaylistList" class="spotify-grid"></div>
            </div>
        </div>
    </div>
   18
    <style>
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .modal-content {
            background: var(--bg);
            padding: 2rem;
            border-radius: 8px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #ddd;
            margin-bottom: 1rem;
        }
        .spotify-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
        }
        .spotify-item {
            cursor: pointer;
            text-align: center;
            padding: 0.5rem;
            border-radius: 4px;
            transition: background 0.2s;
        }
        .spotify-item:hover { background: rgba(255,255,255,0.1); }
        .spotify-item img { width: 100%; border-radius: 4px; margin-bottom: 0.5rem; }
   62 </style>

  3. Client Logic: Spotify API Integration
  Implement the fetching and mapping logic.

  File: public/scripts/scripts.js

    1 // New functions to add to the /playlist scope:
    2
     const openSpotifyModal = async () => {
         const spotifyModal = document.getElementById('spotifyModal');
         const spotifyPlaylistList = document.getElementById('spotifyPlaylistList');
         const spotifyLoading = document.getElementById('spotifyLoading');
         const spotifyConnect = document.getElementById('spotifyConnect');

         spotifyModal.style.display = 'flex';
        spotifyPlaylistList.innerHTML = '';
        spotifyLoading.style.display = 'block';
        spotifyConnect.style.display = 'none';

        const { data } = await supabaseClient.auth.getSession();
        const token = data.session?.provider_token;

        if (!token) {
            spotifyLoading.style.display = 'none';
            spotifyConnect.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('https://api.spotify.com/v1/me/playlists', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            spotifyLoading.style.display = 'none';
            if (result.items) {
                result.items.forEach(pl => {
                    const div = document.createElement('div');
                    div.className = 'spotify-item';
                    const img = pl.images?.[0]?.url || '/images/default-playlist.png';
                    div.innerHTML = `<img src="${img}"><div>${pl.name}</div>`;
                    div.onclick = () => importSpotifyPlaylist(pl.id, pl.name, token);
                    spotifyPlaylistList.appendChild(div);
                });
            }
        } catch (err) {
            console.error('Spotify fetch error', err);
            alert('Failed to load Spotify playlists.');
        }
    };
   45
    const importSpotifyPlaylist = async (id, name, token) => {
        if (!confirm(`Import "${name}"? This will create a new Top 10 list.`)) return;

        try {
            const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            // 1. Create Playlist in DB
            const newPl = await createPlaylist(name);
            if (!newPl) return;

            // 2. Map & Insert Songs (Limit to first 10 for Top 10 app)
            const songs = result.items.slice(0, 10).map(item => ({
                playlist_id: newPl.id,
                title: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', ')
            }));

            await supabaseClient.from('songs').insert(songs);

            document.getElementById('spotifyModal').style.display = 'none';
            await loadPlaylists();
            alert('Playlist imported successfully!');
        } catch (err) {
            console.error('Import error', err);
            alert('Failed to import playlist.');
        }
    };

  ---