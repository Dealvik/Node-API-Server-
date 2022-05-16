SELECT * FROM employeesystem.boards;

SELECT boards.*, users.name FROM boards INNER JOIN users ON boards.createdBy=users.id
WHERE createdBy=10;
