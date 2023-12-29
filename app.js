const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

app.get("/todos/", async (request, response) => {
  const queryParams = request.query;
  const { search_q = "", priority = "", status = "" } = queryParams;

  const getTodoQuery = `
        SELECT * FROM todo 
        WHERE 
            todo LIKE '%${search_q}%' AND
            priority LIKE "%${priority}%" AND 
            status LIKE "%${status}%";
               
    `;

  const todoList = await db.all(getTodoQuery);
  response.send(todoList);
});

app.get("/todos/:todoId/", async (request, response) => {
  const queryParams = request.query;
  const { todoId } = request.params;
  const { search_q = "", priority = "", status = "" } = queryParams;

  const getTodoQuery = `
        SELECT * FROM todo 
        WHERE 
            todo LIKE '%${search_q}%' AND
            priority LIKE "%${priority}%" AND 
            status LIKE "%${status}%" AND 
            id = ${todoId};
               
    `;

  const todoList = await db.get(getTodoQuery);
  response.send(todoList);
});

app.post("/todos/", async (request, response) => {
  const postBody = request.body;
  const { id, todo, priority, status } = postBody;
  const postQuery = `
        INSERT INTO todo(id , todo , priority , status) 
        VALUES(${id} , '${todo}' , '${priority}' , '${status}');
    `;
  const dbResponse = await db.run(postQuery);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE FROM todo 
        WHERE id = ${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const putBody = request.body;
  const { todoId } = request.params;
  let updatedKey = null;

  switch (true) {
    case putBody.todo !== undefined:
      updatedKey = "Todo";
      break;
    case putBody.priority !== undefined:
      updatedKey = "Priority";
      break;
    case putBody.status !== undefined:
      updatedKey = "Status";
      break;
  }
  const getTodoQuery = `
        SELECT * FROM todo 
        WHERE id = ${todoId};
    `;
  const beforeUpdateTodo = await db.get(getTodoQuery);

  const {
    todo = beforeUpdateTodo.todo,
    priority = beforeUpdateTodo.priority,
    status = beforeUpdateTodo.status,
  } = putBody;

  const updateTodoQuery = `
        UPDATE todo 
        SET 
            todo = '${todo}',
            priority = '${priority}',
            status = '${status}' 
        WHERE 
            id = ${todoId};
    `;
  await db.run(updateTodoQuery);
  response.send(`${updatedKey} Updated`);
});
