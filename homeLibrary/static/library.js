function handleSortChange() {
    const sortBy = document.getElementById('sort-options').value;
    fetchBooks(sortBy, '');
}
function handleSearch() {
    const searchQuery = document.getElementById('search-box').value;
    fetchBooks('Authors.Name', searchQuery);
}
async function fetchBooks(sortBy = 'Authors.Name', searchQuery = '') {
    console.log('Sorting by: ', sortBy);
    try {
        const response = await fetch(`/books?sort_by=${encodeURIComponent(sortBy)}&search=${encodeURIComponent(searchQuery)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const books = await response.json();
        const table = document.getElementById('books-table');

        // Clear any existing rows (except the header)
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }

        books.forEach(book => {
            const row = table.insertRow();
            const titleCell = row.insertCell(0);
            const authorCell = row.insertCell(1);
            const genreCell = row.insertCell(2);
            titleCell.textContent = book.title;
            authorCell.textContent = book.author;
            genreCell.textContent = book.genre;
        });
    } catch (error) {
        console.error('Error fetching books:', error);
    }
}