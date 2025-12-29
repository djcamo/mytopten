
(function() {
    // The supabaseClient is initialized globally in GlobalScripts.astro.
    const loggedIn = document.querySelectorAll('.logged-in');

    const signOut = document.getElementById('signOut');
    signOut.addEventListener("click", async (e) => {
        const { error } = await supabaseClient.auth.signOut()
        if (!error) {
            loggedIn.forEach(el => el.style.display = 'none');
            window.location = "/";
        } else {

        }
    });

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
                    document.querySelector('.item:nth-child(1) h3').textContent = data.length;
                }
            });
    }

    const getArtists = async () => {
        const {data} = await supabaseClient.rpc('total_artists');
        if (data) {
            document.querySelector('#number_artists').textContent = data;
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
                    document.querySelector('#number_playlists').textContent = data.length;
                }
            });
    }

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
                    data.forEach(playlist => {
                        const div = document.createElement('div');
                        div.className = 'playlist';
                        div.style.textAlign = 'center';
                        div.style.padding = '1rem';
                        div.innerHTML = `<img src="${playlist.avatar_url}" alt=""><h4>${playlist.username}</h4>`;
                        playlistContainer.appendChild(div);
                    });
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
                        alert.style.display = "block";
                        errors.textContent = error.message;
                    } else {
                        window.location = "/account";
                    }
            } else {
                // alert('Please fill in all fields.');
                const alert = document.querySelector("#warnings");
                alert.style.display = "block";
                errors.textContent = "All fields are mandatory";
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
            document.getElementById('emailPlaceholder').innerHTML = email;
            document.getElementById('displayName').innerHTML = displayName;
            document.getElementById('avatar').src = avatar;
        });

    }




})();
