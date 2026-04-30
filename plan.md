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
    2 <div id="spotifyModal" class="modal-overlay" style="display:none;">
    3     <div class="modal-content">
    4         <div class="modal-header">
    5             <h3>Import from Spotify</h3>
    6             <button id="closeSpotifyModal" class="btn-close">&times;</button>
    7         </div>
    8         <div id="spotifyModalBody" class="modal-body">
    9             <div id="spotifyLoading" style="display:none;">Loading playlists...</div>
   10             <div id="spotifyConnect" style="display:none;">
   11                 <p>Please connect your Spotify account to see your playlists.</p>
   12                 <button id="reconnectSpotify" class="btn btn-primary">Connect Spotify</button>
   13             </div>
   14             <div id="spotifyPlaylistList" class="spotify-grid"></div>
   15         </div>
   16     </div>
   17 </div>
   18
   19 <style>
   20     .modal-overlay {
   21         position: fixed;
   22         top: 0;
   23         left: 0;
   24         width: 100%;
   25         height: 100%;
   26         background: rgba(0,0,0,0.7);
   27         display: flex;
   28         justify-content: center;
   29         align-items: center;
   30         z-index: 1000;
   31     }
   32     .modal-content {
   33         background: var(--bg);
   34         padding: 2rem;
   35         border-radius: 8px;
   36         max-width: 600px;
   37         width: 90%;
   38         max-height: 80vh;
   39         overflow-y: auto;
   40     }
   41     .modal-header {
   42         display: flex;
   43         justify-content: space-between;
   44         align-items: center;
   45         border-bottom: 1px solid #ddd;
   46         margin-bottom: 1rem;
   47     }
   48     .spotify-grid {
   49         display: grid;
   50         grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
   51         gap: 1rem;
   52     }
   53     .spotify-item {
   54         cursor: pointer;
   55         text-align: center;
   56         padding: 0.5rem;
   57         border-radius: 4px;
   58         transition: background 0.2s;
   59     }
   60     .spotify-item:hover { background: rgba(255,255,255,0.1); }
   61     .spotify-item img { width: 100%; border-radius: 4px; margin-bottom: 0.5rem; }
   62 </style>

  3. Client Logic: Spotify API Integration
  Implement the fetching and mapping logic.

  File: public/scripts/scripts.js

    1 // New functions to add to the /playlist scope:
    2
    3 const openSpotifyModal = async () => {
    4     const spotifyModal = document.getElementById('spotifyModal');
    5     const spotifyPlaylistList = document.getElementById('spotifyPlaylistList');
    6     const spotifyLoading = document.getElementById('spotifyLoading');
    7     const spotifyConnect = document.getElementById('spotifyConnect');
    8
    9     spotifyModal.style.display = 'flex';
   10     spotifyPlaylistList.innerHTML = '';
   11     spotifyLoading.style.display = 'block';
   12     spotifyConnect.style.display = 'none';
   13
   14     const { data } = await supabaseClient.auth.getSession();
   15     const token = data.session?.provider_token;
   16
   17     if (!token) {
   18         spotifyLoading.style.display = 'none';
   19         spotifyConnect.style.display = 'block';
   20         return;
   21     }
   22
   23     try {
   24         const response = await fetch('https://api.spotify.com/v1/me/playlists', {
   25             headers: { 'Authorization': `Bearer ${token}` }
   26         });
   27         const result = await response.json();
   28
   29         spotifyLoading.style.display = 'none';
   30         if (result.items) {
   31             result.items.forEach(pl => {
   32                 const div = document.createElement('div');
   33                 div.className = 'spotify-item';
   34                 const img = pl.images?.[0]?.url || '/images/default-playlist.png';
   35                 div.innerHTML = `<img src="${img}"><div>${pl.name}</div>`;
   36                 div.onclick = () => importSpotifyPlaylist(pl.id, pl.name, token);
   37                 spotifyPlaylistList.appendChild(div);
   38             });
   39         }
   40     } catch (err) {
   41         console.error('Spotify fetch error', err);
   42         alert('Failed to load Spotify playlists.');
   43     }
   44 };
   45
   46 const importSpotifyPlaylist = async (id, name, token) => {
   47     if (!confirm(`Import "${name}"? This will create a new Top 10 list.`)) return;
   48
   49     try {
   50         const response = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
   51             headers: { 'Authorization': `Bearer ${token}` }
   52         });
   53         const result = await response.json();
   54
   55         // 1. Create Playlist in DB
   56         const newPl = await createPlaylist(name);
   57         if (!newPl) return;
   58
   59         // 2. Map & Insert Songs (Limit to first 10 for Top 10 app)
   60         const songs = result.items.slice(0, 10).map(item => ({
   61             playlist_id: newPl.id,
   62             title: item.track.name,
   63             artist: item.track.artists.map(a => a.name).join(', ')
   64         }));
   65
   66         await supabaseClient.from('songs').insert(songs);
   67
   68         document.getElementById('spotifyModal').style.display = 'none';
   69         await loadPlaylists();
   70         alert('Playlist imported successfully!');
   71     } catch (err) {
   72         console.error('Import error', err);
   73         alert('Failed to import playlist.');
   74     }
   75 };

  ---