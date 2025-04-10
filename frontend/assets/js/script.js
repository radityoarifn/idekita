document.addEventListener('DOMContentLoaded', () => {
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const dataTable = document.getElementById('data-table');
    const dataBody = document.getElementById('data-body');
    const loginForm = document.getElementById('login-form');
    const login = document.getElementById('login');
    let currentPage = 1;
    let searchQuery = '';

    function fetchData(page = 1) {
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        loginForm.style.display = 'none';
        dataTable.style.display = 'none';

        const url = `backend/api/fetch_data.php?page=${page}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
        fetch(url)
            .then(response => {
                if (response.status === 401) {
                    throw new Error('unauthorized');
                }
                if (!response.ok) {
                    throw new Error('Gagal mengambil data');
                }
                return response.json();
            })
            .then(data => {
                loadingDiv.style.display = 'none';
                if (data.status === 'success') {
                    dataTable.style.display = 'table';
                    dataBody.innerHTML = '';
                    data.data.forEach(row => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `<td>${row.id}</td><td>${row.username}</td>`;
                        dataBody.appendChild(tr);
                    });
                    document.getElementById('page-info').textContent = `Page ${data.page} of ${data.total_pages}`;
                    document.getElementById('prev-page').disabled = data.page === 1;
                    document.getElementById('next-page').disabled = data.page === data.total_pages;
                    currentPage = data.page;
                } else {
                    errorDiv.textContent = data.message;
                    errorDiv.style.display = 'block';
                }
            })
            .catch(error => {
                loadingDiv.style.display = 'none';
                if (error.message === 'unauthorized') {
                    loginForm.style.display = 'block';
                } else {
                    errorDiv.textContent = 'Terjadi kesalahan: ' + error.message;
                    errorDiv.style.display = 'block';
                }
            });
    }

    login.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch('backend/api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    fetchData();
                } else {
                    errorDiv.textContent = data.message;
                    errorDiv.style.display = 'block';
                }
            })
            .catch(error => {
                errorDiv.textContent = 'Terjadi kesalahan saat login';
                errorDiv.style.display = 'block';
            });
    });

    document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        searchQuery = document.getElementById('search').value;
        fetchData(1);
    });

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            fetchData(currentPage - 1);
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        fetchData(currentPage + 1);
    });

    document.getElementById('logout').addEventListener('click', () => {
        fetch('backend/api/logout.php')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    loginForm.style.display = 'block';
                    dataTable.style.display = 'none';
                    errorDiv.textContent = 'Anda telah logout';
                    errorDiv.style.display = 'block';
                }
            });
    });

    fetchData();
});