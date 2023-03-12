package database

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

func Open() *sql.DB {
	db, err := sql.Open("sqlite3", "db/sqlite/sNetwork_migrated.db")

	if err != nil {
		fmt.Printf("Error Opening DB: %v \n", err)
	}

	err = db.Ping()
	if err != nil {
		fmt.Printf("Error Pinging DB: %v \n", err)
	}

	fmt.Println("Connected to db!")

	return db
}
