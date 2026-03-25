
(function() {
    // The supabaseClient is initialized globally in GlobalScripts.astro.
    const loggedIn = document.querySelectorAll('.logged-in');

    const signOut = document.getElementById('signOut');
    if (signOut) {
        signOut.addEventListener("click", async (e) => {
            const { error } = await supabaseClient.auth.signOut()
            if (!error) {
                loggedIn.forEach(el => el.style.display = 'none');
                window.location = "/";
            }
        });
    }

    const isLoggedIn = async () => {
        const { data, error } = await supabaseClient.auth.getSession()
        if (data.session) {
            loggedIn.forEach(el => el.style.display = 'block');
        } else {
            loggedIn.forEach(el => el.style.display = 'none');
        }
    }
    isLoggedIn();

    const getSongs = () => {
        supabaseClient
            .from('songs')
            .select('*')
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching songs:');
                } else {
                    const element = document.querySelector('#number_songs');
                    if (element) {
                        element.textContent = data.length;
                    }
                }
            });
    }

    const getArtists = async () => {
        const {data} = await supabaseClient.rpc('total_artists');
        if (data) {
            const element = document.querySelector('#number_artists');
            if (element) {
                element.textContent = data;
            }
        } else {
            console.error('Error fetching songs count');
        }
    }

    const getPlaylists = async () => {
        supabaseClient
            .from('playlists')
            .select('*')
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching songs:', error);
                } else {
                    const element = document.querySelector('#number_playlists');
                    if (element) {
                        element.textContent = data.length;
                    }
                }
            });
    }

    let currentPlaylist = null;

    const requireLogin = async () => {
        const { data } = await supabaseClient.auth.getSession();
        if (!data?.session?.user) {
            window.location = "/login";
            return null;
        }
        return data.session.user;
    };

    const getLatestPlaylists = () => {
        supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching latest playlists:', error);
                } else {
                    const playlistContainer = document.querySelector('#latest-playlists');
                    if (playlistContainer) {
                        data.forEach(playlist => {
                            const div = document.createElement('div');
                            div.className = 'playlist';
                            div.style.textAlign = 'center';
                            div.style.padding = '1rem';
                            div.innerHTML = `<img src="${playlist.avatar_url}" alt=""><h4>${playlist.username}</h4>`;
                            playlistContainer.appendChild(div);
                        });
                    }
                }
            });
    }


    /* page specific code */

    if (window.location.pathname === "/") {
        getSongs();
        getArtists();
        getPlaylists();
        getLatestPlaylists();
    }


    if (window.location.pathname === "/login" || window.location.pathname === "/login/") {
        const showLoginForm = document.getElementById('showLoginForm');
        const emailLoginForm = document.getElementById('emailLoginForm');
        const errors = document.getElementById('errors');
        const spotifyLogin = document.getElementById('spotifyLogin');

        showLoginForm.addEventListener('click', () => {
            if (emailLoginForm.style.display === 'none') {
                emailLoginForm.style.display = 'block';
                showLoginForm.textContent = '';
            } else {
                emailLoginForm.style.display = 'none';
                showLoginForm.textContent = 'Log in with email';
            }
        });
        emailLoginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (email && password) {
                    const { user, session, error } = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password,
                    })
                    if (error) {
                        const alert = document.querySelector("#warnings");
                        if (alert) {
                            alert.style.display = "block";
                            errors.textContent = error.message;
                        }
                    } else {
                        window.location = "/account";
                    }
            } else {
                // alert('Please fill in all fields.');
                const alert = document.querySelector("#warnings");
                if (alert) {
                    alert.style.display = "block";
                    errors.textContent = "All fields are mandatory";
                }
            }
        });

        async function signInWithSpotify() {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'spotify',
            })
        }

        spotifyLogin.addEventListener('click', (e) => {
            signInWithSpotify();
        });
    }

    if (window.location.pathname === "/create_account" || window.location.pathname === "/create_account/") {
        const showCreateForm = document.getElementById("showCreateForm");
        const emailCreateForm = document.getElementById("emailCreateForm");
        const spotifyLogin = document.getElementById("spotifyLogin");
        const errors = document.getElementById('errors');

        showCreateForm.addEventListener('click', () => {
            if (emailCreateForm.style.display === 'none') {
                emailCreateForm.style.display = 'block';
                showCreateForm.textContent = '';
            } else {
                emailCreateForm.style.display = 'none';
                showCreateForm.textContent = 'Log in with email';
            }
        });

        emailCreateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('passwordConfirm').value;

            if (password !== passwordConfirm) {
                errors.innerText = "Passwords do not match.";
                return;
            }

            if (email && password && passwordConfirm) {
                const { data, error } = await supabaseClient.auth.signUp({  email: email,  password: password,})
            } else {
                alert('Please fill in all fields.');
            }

        });

        async function signInWithSpotify() {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'spotify',
            })
        }

        spotifyLogin.addEventListener('click', (e) => {
            signInWithSpotify();
        });
    }

    if (window.location.pathname === "/account" || window.location.pathname === "/account/") {

        const getUser = async () => {
            const { data: { user } } = await supabaseClient.auth.getUser();
            return user;
        }

        getUser()
        .then(data => {
            // console.log(data);
            const id = data.id;
            const email = data.email;
            let displayName = '';
            let avatar = '';
            //* get meta data
            if(data.app_metadata.provider) {
                avatar = data.user_metadata.avatar_url;
                displayName = data.user_metadata.full_name;
                console.log(id,email,avatar,displayName);
            }
            //todo check if user exists in profiles table
            supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', id)
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching songs:');
                } else {
                    if (data.length !== 0) {
                        console.log(data);
                    } else {
                        supabaseClient
                        .from('profiles')
                        .insert([
                            { id: id, username: displayName, avatar_url: avatar }
                        ])
                        .select()
                        .then(({ data, error }) => {
                            if (error) {
                                console.error('Error');
                            } else {
                                console.log(data);
                            }
                        });
                    }

                }
            });


            //todo if in profile table, update profile with meta data


            //* display user data
            const emailEl = document.getElementById('emailPlaceholder');
            const nameEl = document.getElementById('displayName');
            const avatarEl = document.getElementById('avatar');
            if (emailEl) emailEl.innerHTML = email;
            if (nameEl) nameEl.innerHTML = displayName;
            if (avatarEl) avatarEl.src = avatar;
        });

    }





    if (window.location.pathname === "/playlist" || window.location.pathname === "/playlist/") {
        const newPlaylistName = document.getElementById('newPlaylistName');
        const createPlaylistBtn = document.getElementById('createPlaylist');
        const importSpotifyBtn = document.getElementById('importSpotify');
        const playlistList = document.getElementById('playlistList');
        const noPlaylists = document.getElementById('noPlaylists');
        const playlistDetails = document.getElementById('playlistDetails');
        const currentPlaylistName = document.getElementById('currentPlaylistName');
        const deletePlaylistBtn = document.getElementById('deletePlaylist');
        const addSongBtn = document.getElementById('addSongBtn');
        const addSongForm = document.getElementById('addSongForm');
        const songTitleInput = document.getElementById('songTitle');
        const songArtistInput = document.getElementById('songArtist');
        const saveSongBtn = document.getElementById('saveSongBtn');
        const cancelSongBtn = document.getElementById('cancelSongBtn');
        const songsTableBody = document.getElementById('songsTableBody');

        const loadPlaylists = async () => {
            const user = await requireLogin();
            if (!user) return;
            const { data, error } = await supabaseClient
                .from('playlists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error loading playlists', error);
                return;
            }
            renderPlaylists(data || []);
        };

        const renderPlaylists = (playlists) => {
            playlistList.innerHTML = '';
            if (!playlists || playlists.length === 0) {
                noPlaylists.style.display = 'block';
                playlistDetails.style.display = 'none';
                return;
            }
            noPlaylists.style.display = 'none';
            playlists.forEach(pl => {
                const card = document.createElement('div');
                card.className = 'playlist-card';
                card.innerHTML = `
                    <strong>${pl.name || 'Untitled'}</strong>
                    <div class="text-muted" style="font-size:0.9rem;">${new Date(pl.created_at).toLocaleDateString()}</div>
                `;
                card.addEventListener('click', () => selectPlaylist(pl, card));
                playlistList.appendChild(card);
            });
            if (!currentPlaylist && playlists.length > 0) {
                selectPlaylist(playlists[0], playlistList.firstChild);
            }
        };

        const selectPlaylist = async (playlist, cardElement) => {
            currentPlaylist = playlist;
            currentPlaylistName.textContent = playlist.name || 'Untitled playlist';
            playlistDetails.style.display = 'block';
            Array.from(playlistList.children).forEach(el => el.classList.remove('active'));
            if (cardElement) cardElement.classList.add('active');
            await loadSongs(playlist.id);
        };

        const loadSongs = async (playlistId) => {
            songsTableBody.innerHTML = '';
            if (!playlistId) return;
            const { data, error } = await supabaseClient
                .from('songs')
                .select('*')
                .eq('playlist_id', playlistId)
                .order('created_at', { ascending: true });
            if (error) {
                console.error('Error loading songs', error);
                return;
            }
            renderSongs(data || []);
        };

        const renderSongs = (songs) => {
            songsTableBody.innerHTML = '';
            if (!songs || songs.length === 0) {
                songsTableBody.innerHTML =
                    `<tr><td colspan="3" class="text-muted">No songs yet. Add one below.</td></tr>`;
                return;
            }
            songs.forEach(song => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${song.title || ''}</td>
                    <td>${song.artist || ''}</td>
                    <td class="text-right">
                        <button class="btn btn-light btn-sm edit-song" data-id="${song.id}">Edit</button>
                        <button class="btn btn-light btn-sm delete-song" data-id="${song.id}">Delete</button>
                    </td>
                `;
                songsTableBody.appendChild(tr);

                tr.querySelector('.delete-song').addEventListener('click', () => deleteSong(song.id));
                tr.querySelector('.edit-song').addEventListener('click', () => startEditSong(song));
            });
        };

        const startEditSong = (song) => {
            songTitleInput.value = song.title || '';
            songArtistInput.value = song.artist || '';
            addSongForm.dataset.editingId = song.id;
            addSongForm.style.display = 'block';
        };

        const clearAddSongForm = () => {
            songTitleInput.value = '';
            songArtistInput.value = '';
            delete addSongForm.dataset.editingId;
        };

        const toggleAddSongForm = (show) => {
            addSongForm.style.display = show ? 'block' : 'none';
        };

        const createPlaylist = async (name) => {
            const user = await requireLogin();
            if (!user) return;
            const { data, error } = await supabaseClient
                .from('playlists')
                .insert([{ name, user_id: user.id }])
                .select()
                .single();
            if (error) {
                console.error('Error creating playlist', error);
                return;
            }
            await loadPlaylists();
            return data;
        };

        const deletePlaylist = async (playlistId) => {
            if (!playlistId) return;
            await supabaseClient.from('songs').delete().eq('playlist_id', playlistId);
            const { error } = await supabaseClient.from('playlists').delete().eq('id', playlistId);
            if (error) {
                console.error('Error deleting playlist', error);
                return;
            }
            currentPlaylist = null;
            await loadPlaylists();
        };

        const deleteSong = async (songId) => {
            const { error } = await supabaseClient.from('songs').delete().eq('id', songId);
            if (error) {
                console.error('Error deleting song', error);
                return;
            }
            if (currentPlaylist) {
                await loadSongs(currentPlaylist.id);
            }
        };

        const saveSong = async () => {
            if (!currentPlaylist) return;
            const title = songTitleInput.value.trim();
            const artist = songArtistInput.value.trim();
            if (!title || !artist) {
                alert('Please enter both song title and artist.');
                return;
            }

            const isEditing = addSongForm.dataset.editingId;
            if (isEditing) {
                const { error } = await supabaseClient
                    .from('songs')
                    .update({ title, artist })
                    .eq('id', isEditing);
                if (error) {
                    console.error('Error updating song', error);
                    return;
                }
            } else {
                const { error } = await supabaseClient
                    .from('songs')
                    .insert([{ playlist_id: currentPlaylist.id, title, artist }]);
                if (error) {
                    console.error('Error adding song', error);
                    return;
                }
            }
            clearAddSongForm();
            toggleAddSongForm(false);
            await loadSongs(currentPlaylist.id);
        };

        createPlaylistBtn.addEventListener('click', async () => {
            const name = newPlaylistName.value.trim();
            if (!name) {
                alert('Please provide a playlist name.');
                return;
            }
            await createPlaylist(name);
            newPlaylistName.value = '';
        });

        importSpotifyBtn.addEventListener('click', () => {
            alert('Spotify import not implemented yet.');
        });

        deletePlaylistBtn.addEventListener('click', () => {
            if (!currentPlaylist) return;
            if (confirm('Delete this playlist? This cannot be undone.')) {
                deletePlaylist(currentPlaylist.id);
            }
        });

        addSongBtn.addEventListener('click', () => {
            toggleAddSongForm(true);
        });

        cancelSongBtn.addEventListener('click', () => {
            clearAddSongForm();
            toggleAddSongForm(false);
        });

        saveSongBtn.addEventListener('click', async () => {
            await saveSong();
        });

        loadPlaylists().catch(console.error);
    }

})();
