from flask import Flask, render_template, jsonify, request
import os
import sqlite3

app = Flask(__name__)

#route to serve web page
@app.route('/')
def home():
    return render_template('index.html')

#route to fetch books from database
@app.route('/books', methods=['POST'])
def get_books():
    data = request.get_json()
    sort_by = data.get('sort_by', 'Authors.Name') #default to sort authors alphabetically
    search_query = data.get('search', '').strip().lower() #get search query
    if sort_by not in ['Authors.Name', 'Books.Title', 'Books.Genre']:
        sort_by = 'Authors.Name' #fallback to default
    conn = sqlite3.connect('library.db')
    cursor = conn.cursor()

    #construct query
    if search_query:
        # Use a parameterized query to prevent SQL injection
        cursor.execute(f'''
            SELECT Books.Title, Authors.Name, Books.Genre
            FROM Books
            JOIN Authors ON Books.AuthorID = Authors.AuthorID
            WHERE LOWER(Books.Title) LIKE ? OR LOWER(Authors.Name) LIKE ?
            ORDER BY {sort_by};
        ''', (f'%{search_query}%', f'%{search_query}%'))
    else:
        # No search query, just sort the books
        cursor.execute(f'''
            SELECT Books.Title, Authors.Name, Books.Genre
            FROM Books
            JOIN Authors ON Books.AuthorID = Authors.AuthorID
            ORDER BY {sort_by};
        ''')

    
    books = cursor.fetchall()
    conn.close()
    return jsonify([{'title': title, 'author': author, 'genre': genre} for title, author, genre in books])

if __name__ == '__main__':
    app.run(debug=True)