<?php
// Allow CORS for local development (and cross-origin if deployed securely)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalize URI (remove base path /api/ if present)
// cPanel requests might look like /api/people/1 so we extract 'people' and '1'
$path = trim(str_replace('/api/', '/', $requestUri), '/');
$parts = array_values(array_filter(explode('/', $path)));

// Endpoints
$resource = $parts[0] ?? '';
$id = isset($parts[1]) ? (int)$parts[1] : null;

// Helper to get body
function getBody() {
    return json_decode(file_get_contents("php://input"), true);
}

// Ensure integers and types match frontend expectations structure
$castPersonTypes = function($row) {
    $row['id'] = (int)$row['id'];
    return $row;
};

// ======================================
// /api/login POST
// ======================================
if ($resource === 'login' && $method === 'POST') {
    $data = getBody();
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    
    if ($email === ADMIN_EMAIL && $password === ADMIN_PASSWORD) {
        echo json_encode(['success' => true, 'user' => ['email' => ADMIN_EMAIL]]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
    exit;
}

// ======================================
// /api/people
// ======================================
if ($resource === 'people') {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single person
                try {
                    $stmt = $pdo->prepare("SELECT * FROM Person WHERE id = ?");
                    $stmt->execute([$id]);
                    $person = $stmt->fetch();
                    
                    if (!$person) {
                        http_response_code(404);
                        echo json_encode(['error' => 'Person not found']);
                        exit;
                    }
                    
                    $person = $castPersonTypes($person);
                    
                    // Fetch dynamic fields
                    $stmt = $pdo->prepare("SELECT * FROM DynamicField WHERE personId = ?");
                    $stmt->execute([$id]);
                    $person['dynamicFields'] = $stmt->fetchAll();
                    
                    // Fetch linked people
                    $stmt = $pdo->prepare("SELECT * FROM LinkedPerson WHERE parentId = ?");
                    $stmt->execute([$id]);
                    $linkedPeople = $stmt->fetchAll();
                    
                    foreach ($linkedPeople as &$linked) {
                        $linked['id'] = (int)$linked['id'];
                        $linked['parentId'] = (int)$linked['parentId'];
                        $stmt = $pdo->prepare("SELECT * FROM DynamicLinkField WHERE linkedPersonId = ?");
                        $stmt->execute([$linked['id']]);
                        $linked['dynamicFields'] = $stmt->fetchAll();
                    }
                    $person['linkedPeople'] = $linkedPeople;
                    
                    echo json_encode($person);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => $e->getMessage()]);
                }
            } else {
                // Get all people
                try {
                    $stmt = $pdo->query("SELECT * FROM Person ORDER BY createdAt DESC");
                    $people = $stmt->fetchAll();
                    
                    foreach ($people as &$person) {
                        $person = $castPersonTypes($person);
                        $stmt = $pdo->prepare("SELECT * FROM DynamicField WHERE personId = ?");
                        $stmt->execute([$person['id']]);
                        $person['dynamicFields'] = $stmt->fetchAll();
                        
                        $stmt = $pdo->prepare("SELECT * FROM LinkedPerson WHERE parentId = ?");
                        $stmt->execute([$person['id']]);
                        $linkedPeople = $stmt->fetchAll();
                        
                        foreach ($linkedPeople as &$linked) {
                            $linked['id'] = (int)$linked['id'];
                            $linked['parentId'] = (int)$linked['parentId'];
                            $stmt = $pdo->prepare("SELECT * FROM DynamicLinkField WHERE linkedPersonId = ?");
                            $stmt->execute([$linked['id']]);
                            $linked['dynamicFields'] = $stmt->fetchAll();
                        }
                        $person['linkedPeople'] = $linkedPeople;
                    }
                    echo json_encode($people);
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(['error' => $e->getMessage()]);
                }
            }
            break;
            
        case 'POST':
            $data = getBody();
            try {
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("INSERT INTO Person (name, nric, studentId, taxNumber, address, bankAccount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
                $stmt->execute([
                    $data['name'] ?? '',
                    $data['nric'] ?? null,
                    $data['studentId'] ?? null,
                    $data['taxNumber'] ?? null,
                    $data['address'] ?? null,
                    $data['bankAccount'] ?? null
                ]);
                
                $personId = $pdo->lastInsertId();
                
                if (!empty($data['dynamicFields'])) {
                    $stmt = $pdo->prepare("INSERT INTO DynamicField (type, label, value, personId) VALUES (?, ?, ?, ?)");
                    foreach ($data['dynamicFields'] as $field) {
                        $stmt->execute([$field['type'], $field['label'] ?? null, $field['value'], $personId]);
                    }
                }
                
                if (!empty($data['linkedPeople'])) {
                    foreach ($data['linkedPeople'] as $linked) {
                        $stmtLinked = $pdo->prepare("INSERT INTO LinkedPerson (name, relationship, nric, studentId, taxNumber, address, bankAccount, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                        $stmtLinked->execute([
                            $linked['name'] ?? '',
                            $linked['relationship'] ?? '',
                            $linked['nric'] ?? null,
                            $linked['studentId'] ?? null,
                            $linked['taxNumber'] ?? null,
                            $linked['address'] ?? null,
                            $linked['bankAccount'] ?? null,
                            $personId
                        ]);
                        
                        $linkedPersonId = $pdo->lastInsertId();
                        
                        if (!empty($linked['dynamicFields'])) {
                            $stmtField = $pdo->prepare("INSERT INTO DynamicLinkField (type, label, value, linkedPersonId) VALUES (?, ?, ?, ?)");
                            foreach ($linked['dynamicFields'] as $field) {
                                $stmtField->execute([$field['type'], $field['label'] ?? null, $field['value'], $linkedPersonId]);
                            }
                        }
                    }
                }
                
                $pdo->commit();
                
                // Fetch the new person to return exact structure requested
                // This simplifies logic vs returning raw data array back
                $stmt = $pdo->prepare("SELECT * FROM Person WHERE id = ?");
                $stmt->execute([$personId]);
                $createdPerson = $castPersonTypes($stmt->fetch());
                http_response_code(201);
                echo json_encode($createdPerson);
                
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;
            
        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID is required']);
                exit;
            }
            
            $data = getBody();
            try {
                $pdo->beginTransaction();
                
                $stmt = $pdo->prepare("UPDATE Person SET name=?, nric=?, studentId=?, taxNumber=?, address=?, bankAccount=?, updatedAt=NOW() WHERE id=?");
                $stmt->execute([
                    $data['name'] ?? '',
                    $data['nric'] ?? null,
                    $data['studentId'] ?? null,
                    $data['taxNumber'] ?? null,
                    $data['address'] ?? null,
                    $data['bankAccount'] ?? null,
                    $id
                ]);
                
                // Delete existing related fields
                $pdo->prepare("DELETE FROM DynamicField WHERE personId=?")->execute([$id]);
                // Delete LinkedPerson (DynamicLinkField cascades or deleted explicitly)
                $linkedPeopleStmt = $pdo->prepare("SELECT id FROM LinkedPerson WHERE parentId=?");
                $linkedPeopleStmt->execute([$id]);
                $linkedPeopleIds = $linkedPeopleStmt->fetchAll(PDO::FETCH_COLUMN);
                if ($linkedPeopleIds) {
                    $inPlaceholders = implode(',', array_fill(0, count($linkedPeopleIds), '?'));
                    $pdo->prepare("DELETE FROM DynamicLinkField WHERE linkedPersonId IN ($inPlaceholders)")->execute($linkedPeopleIds);
                }
                $pdo->prepare("DELETE FROM LinkedPerson WHERE parentId=?")->execute([$id]);
                
                // Insert new ones
                if (!empty($data['dynamicFields'])) {
                    $stmt = $pdo->prepare("INSERT INTO DynamicField (type, label, value, personId) VALUES (?, ?, ?, ?)");
                    foreach ($data['dynamicFields'] as $field) {
                        $stmt->execute([$field['type'], $field['label'] ?? null, $field['value'], $id]);
                    }
                }
                
                if (!empty($data['linkedPeople'])) {
                    foreach ($data['linkedPeople'] as $linked) {
                        $stmtLinked = $pdo->prepare("INSERT INTO LinkedPerson (name, relationship, nric, studentId, taxNumber, address, bankAccount, parentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                        $stmtLinked->execute([
                            $linked['name'] ?? '',
                            $linked['relationship'] ?? '',
                            $linked['nric'] ?? null,
                            $linked['studentId'] ?? null,
                            $linked['taxNumber'] ?? null,
                            $linked['address'] ?? null,
                            $linked['bankAccount'] ?? null,
                            $id
                        ]);
                        
                        $linkedPersonId = $pdo->lastInsertId();
                        
                        if (!empty($linked['dynamicFields'])) {
                            $stmtField = $pdo->prepare("INSERT INTO DynamicLinkField (type, label, value, linkedPersonId) VALUES (?, ?, ?, ?)");
                            foreach ($linked['dynamicFields'] as $field) {
                                $stmtField->execute([$field['type'], $field['label'] ?? null, $field['value'], $linkedPersonId]);
                            }
                        }
                    }
                }
                
                $pdo->commit();
                $data['id'] = $id;
                echo json_encode($data);
                
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;
            
        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID is required']);
                exit;
            }
            try {
                $pdo->beginTransaction();
                
                $linkedPeopleStmt = $pdo->prepare("SELECT id FROM LinkedPerson WHERE parentId=?");
                $linkedPeopleStmt->execute([$id]);
                $linkedPeopleIds = $linkedPeopleStmt->fetchAll(PDO::FETCH_COLUMN);
                
                if ($linkedPeopleIds) {
                    $inPlaceholders = implode(',', array_fill(0, count($linkedPeopleIds), '?'));
                    $pdo->prepare("DELETE FROM DynamicLinkField WHERE linkedPersonId IN ($inPlaceholders)")->execute($linkedPeopleIds);
                }
                
                $pdo->prepare("DELETE FROM LinkedPerson WHERE parentId=?")->execute([$id]);
                $pdo->prepare("DELETE FROM DynamicField WHERE personId=?")->execute([$id]);
                $pdo->prepare("DELETE FROM Person WHERE id=?")->execute([$id]);
                
                $pdo->commit();
                echo json_encode(['message' => 'Record deleted successfully']);
            } catch (Exception $e) {
                $pdo->rollBack();
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;
    }
    exit;
}

// Fallback
http_response_code(404);
echo json_encode(['error' => 'Endpoint not found or method not allowed']);
