const db = require('../config');
const bcrypt = require('bcrypt');

class User {
  // Create a new user
  static async create(userData) {
    const { name, email, password, designation, business_unit } = userData;
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO "Users" (name, email, password, designation, business_unit)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, designation, business_unit, created_at
    `;
    
    const values = [name, email, hashedPassword, designation, business_unit];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async findById(id) {
    const query = `
      SELECT id, name, email, designation, business_unit, created_at, updated_at
      FROM "Users" WHERE id = $1
    `;
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user by email
  static async findByEmail(email) {
    const query = `
      SELECT id, name, email, password, designation, business_unit, created_at, updated_at
      FROM "Users" WHERE email = $1
    `;
    
    try {
      const result = await db.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all users
  static async findAll() {
    const query = `
      SELECT id, name, email, designation, business_unit, created_at, updated_at
      FROM "Users" ORDER BY created_at DESC
    `;
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, updateData) {
    const { name, email, designation, business_unit } = updateData;
    
    const query = `
      UPDATE "Users" 
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          designation = COALESCE($3, designation),
          business_unit = COALESCE($4, business_unit),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, designation, business_unit, created_at, updated_at
    `;
    
    const values = [name, email, designation, business_unit, id];
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE "Users" 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    
    try {
      const result = await db.query(query, [hashedPassword, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM "Users" WHERE id = $1 RETURNING id';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get users by business unit
  static async findByBusinessUnit(businessUnit) {
    const query = `
      SELECT id, name, email, designation, business_unit, created_at, updated_at
      FROM "Users" WHERE business_unit = $1 ORDER BY name
    `;
    
    try {
      const result = await db.query(query, [businessUnit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get users by designation
  static async findByDesignation(designation) {
    const query = `
      SELECT id, name, email, designation, business_unit, created_at, updated_at
      FROM "Users" WHERE designation = $1 ORDER BY name
    `;
    
    try {
      const result = await db.query(query, [designation]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User; 