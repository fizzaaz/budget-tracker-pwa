//variable to hold db connection

let db;

//establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget',1);

//this event will emit if the database version changes(nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    //create an object store(table) called `pending`, set it to have an auto incrementing primery key of sorts
    db.createObjectStore('pending', { autoIncrement: true});
};

//upon a successful creation
request.onsuccess = function(event){

    //when db is succesfully created with its object store(from onupgradedneeded event above) or simply established a connection, save reference to db in global variable)
    db = event.target.result;

    //check if app is online, if yes run uploadBudget() function to send all local db data to api
    if(navigator.onLine){
        uploadPendingBudget();
    }
};

request.onerror = function(event){
    //log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['pending'], 'readwrite');

    console.log(transaction);
  
    // access the object store for `pending`
    const store = transaction.objectStore('pending');

    console.log(store)
    console.log("This is the record " + {record})
  
    // add record to your store with add method
    store.add(record);
}

function uploadPendingBudget(){
    //open a transaction on your db
    const transaction = db.transaction(['pending'], 'readwrite');
    
    //access your object store
    const store = transaction.objectStore('pending');

    //get all records from store and set to a variable
    const getAll = store.getAll();

    //upond a successful .getAll() execution, run this function
    getAll.onsuccess = function(){
        //if there is data in indexDB, send to api server
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    'Content-Type': 'application/json'
                }
            })

                .then(response => response.json())
                .then(serverResponse => {
                    if(serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    //open one more transaction
                    const transaction = db.transaction (['pending'], 'readwrite');

                    //access the pending object store
                    const store = transaction.objectStore('pending')

                    //clear all items in store
                    store.clear();

                    alert("All pending transactions have been submitted!");
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }
}

// //listen for app coming back online
window.addEventListener('online', uploadPendingBudget);