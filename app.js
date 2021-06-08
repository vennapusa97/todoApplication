const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusAndCategoryProperties(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}'
        AND category = '${category}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = `
        SELECT
          *
        FROM
            todo
        WHERE
            category = '${category}'
        `;
      break;
    default:
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodoQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoIdQuery = `
    SELECT
      *
    FROM
        todo
    WHERE 
        id = ${todoId};
  `;
  const todo = await database.get(getTodoIdQuery);
  response.send(todo);
});

app.get("/agenda/", async (request, response) => {
  const { agenda, dueDate } = request.query;

  const getAgendaDataQuery = `
    SELECT
      *
    FROM
        todo
    WHERE
        due_date = '${dueDate}';
        
  `;
  const agendaDueDate = await database.get(getAgendaDataQuery);
  response.send(agendaDueDate);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const postTodoQuery = `
    INSERT INTO
        todo(id, todo, priority, status, category, due_date)
    VALUES
        (
            ${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}'
        )
  `;
  await database.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "category";
      break;
    case requestBody.due_date !== undefined:
      updateColumn = "dueDate";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status === undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority === undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo === undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category === undefined:
      updateColumn = "category";
      break;
    case requestBody.due_date === undefined:
      updateColumn = "dueDate";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}',
      category = '${category}',
      due_date = '${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`Invalid Todo ${updateColumn}`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
        DELETE FROM
            todo
        WHERE
            id = ${todoId};
  `;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
