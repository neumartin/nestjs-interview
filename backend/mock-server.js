
const express = require('express');
const app = express();
const port = 8080;

app.use(express.json());

// In-memory data store
let todoLists = [
    {
        id: 'ext-1',
        name: 'External Board',
        todoItems: [
            { id: 'item-1', description: 'Task form external', isFinished: false }
        ]
    }
];

// Generate simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// GET /todolists
app.get('/todolists', (req, res) => {
    console.log('GET /todolists');
    res.json(todoLists);
});

// POST /todolists
app.post('/todolists', (req, res) => {
    const newList = {
        id: generateId(),
        name: req.body.name,
        todoItems: []
    };
    todoLists.push(newList);
    console.log(`POST /todolists - Created list ${newList.id}`);
    res.status(201).json(newList);
});

// PATCH /todolists/:id
app.patch('/todolists/:id', (req, res) => {
    const list = todoLists.find(l => l.id === req.params.id);
    if (list) {
        if (req.body.name) list.name = req.body.name;
        console.log(`PATCH /todolists/${req.params.id} - Updated`);
        res.json(list);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// DELETE /todolists/:id
app.delete('/todolists/:id', (req, res) => {
    const index = todoLists.findIndex(l => l.id === req.params.id);
    if (index !== -1) {
        todoLists.splice(index, 1);
        console.log(`DELETE /todolists/${req.params.id} - Deleted`);
        res.status(204).send();
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// POST /todolists/:listId/todoitems
app.post('/todolists/:listId/todoitems', (req, res) => {
    const list = todoLists.find(l => l.id === req.params.listId);
    if (list) {
        const newItem = {
            id: generateId(),
            description: req.body.description,
            isFinished: req.body.isFinished || false
        };
        list.todoItems = list.todoItems || [];
        list.todoItems.push(newItem);
        console.log(`POST /items - Created item ${newItem.id} in list ${list.id}`);
        res.status(201).json(newItem);
    } else {
        res.status(404).json({ error: 'List not found' });
    }
});

// PATCH /todolists/:listId/todoitems/:itemId
app.patch('/todolists/:listId/todoitems/:itemId', (req, res) => {
    const list = todoLists.find(l => l.id === req.params.listId);
    if (list) {
        const item = list.todoItems.find(i => i.id === req.params.itemId);
        if (item) {
            if (req.body.description !== undefined) item.description = req.body.description;
            if (req.body.isFinished !== undefined) item.isFinished = req.body.isFinished;
            console.log(`PATCH /items/${req.params.itemId} - Updated`);
            res.json(item);
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } else {
        res.status(404).json({ error: 'List not found' });
    }
});

// DELETE /todolists/:listId/todoitems/:itemId
app.delete('/todolists/:listId/todoitems/:itemId', (req, res) => {
    const list = todoLists.find(l => l.id === req.params.listId);
    if (list) {
        const index = list.todoItems.findIndex(i => i.id === req.params.itemId);
        if (index !== -1) {
            list.todoItems.splice(index, 1);
            console.log(`DELETE /items/${req.params.itemId} - Deleted`);
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    } else {
        res.status(404).json({ error: 'List not found' });
    }
});

app.listen(port, () => {
    console.log(`External API Mock running at http://localhost:${port}`);
});
