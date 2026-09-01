import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dayjs from "dayjs";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "[yourdbname]",
    password: "[yourpassword]",
    port: 5432,
});
db.connect();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function verifyISBN(isbn) {
    try {
        // Use the isbn to check with the Covers API to see if got the book covers.
        const response = await axios.get('https://covers.openlibrary.org/b/isbn/'+isbn+'-S.jpg?default=false');
        return true;
    } catch (err) {
        if (err.status >= 404) {
            console.log(err);
            return false;
        }
    }
}

async function validateUserInput(title, author, isbn, readDate, rating) {
    let errMsg = "";

    if (!title) {
        return errMsg = "Book title cannot be empty.";
    }
    if (!author) {
        return errMsg = "Author name cannot be empty.";
    }
    if (isbn.length < 10 || isbn.length > 13) {
        return errMsg = "Invalid ISBN.";
    } else {
        const result = await verifyISBN(isbn);
        if (!result) {
            return errMsg = "No book is found using the ISBN you provided, please check your book's ISBN and try again.";
        }
    }
    if (!readDate) {
        return errMsg = "Please select the date of read.";
    }
    if (!rating) {
       return errMsg = "Please select a rating";
    }

    if (errMsg.length > 0) {
        return errMsg;
    } else {
        return true;
    }

}

app.get("/", async (req, res) => {
    const sort = req.query.sort;
    let query = "SELECT * FROM books";

    if (sort == "rating") {
        query+= " ORDER BY rating DESC";
    } else if (sort == "recent") {
        query+= " ORDER BY read_date DESC";
    } else {
        query+= " ORDER BY id ASC";
    }
    
    try {
        const result = await db.query(query);
        const books = result.rows;
        for (let book of books) {
            // FORMAT THE DATE FROM BACKEND
            book['read_date'] = dayjs(book['read_date']).format("YYYY-MM-DD");
        }
        res.render("main", {
            books: result.rows
        });
    } catch (err) {
        console.log(err);
        res.send("Database Error");
    }
});

app.get("/add", (req, res) => {
    res.render("add");
});

app.post("/insertBook", async(req, res) => {
    let {
        title,
        author,
        isbn,
        readDate,
        rating,
        review,
    } = req.body;

    // Validate user's input
    const errMsg = await validateUserInput(title.trim(), author.trim(), isbn.trim(), readDate, rating);

    if (errMsg.length > 1) {
        return res.json({"error": errMsg});
    } else {
        // Validation passed insert the record into database
        try {
            await db.query('INSERT INTO books (title, author, rating, review, read_date, isbn) VALUES ($1, $2, $3, $4, $5, $6)', [title, author, parseInt(rating), review, readDate, isbn]);
            return res.json({"success":"The book has been saved."});
        } catch (err) {
            console.log(err);
            return res.send('Database Error');
        }
    }
});

app.get("/edit/:id", async(req, res) => {
    try {
        const result = await db.query("SELECT * FROM books WHERE id = $1", [req.params.id]);

        const db_read_date = result.rows[0]['read_date'];
        var formatted_date = dayjs(db_read_date).format("YYYY-MM-DD");
        result.rows[0]['read_date'] = formatted_date;

        res.render("edit", {
            book: result.rows[0]
        });
        
    } catch (err) {
        console.log(err);
        res.send("Database Error");
    }
});

app.post("/edit/:id", async(req, res) => {
    const bookId = req.params.id;
    let {
        title,
        author,
        isbn,
        readDate,
        rating,
        review
    } = req.body;

    // Validate user's input
    const errMsg = await validateUserInput(title.trim(), author.trim(), isbn.trim(), readDate, rating);

    if (errMsg.length > 1) {
        return res.json({"error": errMsg});
    } else {
        try {
            const result = await db.query(`UPDATE books
            SET 
                title = $1, 
                author = $2, 
                rating = $3, 
                review = $4, 
                read_date = $5,
                isbn = $6 
            WHERE id = $7`, 
            [
                title,
                author,
                parseInt(rating), 
                review, 
                readDate,
                isbn,
                bookId
            ]);
            return res.json({"success":"The book details have been updated successfully."});
        } catch (err) {
            console.log(err);
            return res.send("Database Error, Fail to Update");
        }
    }
});

app.post("/delete", async(req, res) => {
    const bookId = req.body.bookId;
    if (bookId) {
        try {
            const result = await db.query("DELETE FROM books WHERE id = $1", [bookId]);
            return res.json({message:"SUCCESS"});
        } catch (err) {
            console.log(err);
            return res.send("Database error, Fail to delete");
        }
    } else {
        return res.send("Fail to delete, book id is not provided.");
    }
});

app.listen(port, () => {
    console.log(`SERVER IS RUNNING ON PORT ${port}`);
});