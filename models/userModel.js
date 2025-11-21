import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { encrypt, decrypt, createHash } from "../utils/encryption.js";

//?   User schema of the application 
const userScheme = mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim: true,
        minlength: 1,
        maxlength: 50
    },

    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 1,
        maxlength: 50
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message: "Please provide a valid email address."
        }
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    passwordHash: {
        type: String,
        select: false,
        default: null
    },

    profile: {
        type: String,
        default: null,
    },

    phone_no: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 10,
        maxlength: 15,
        validate: {
            validator: function (v) {
                return /^\d+$/.test(v);
            },
            message: "Phone number should contain only digits."
        }
    },

    verified: {
        type: Boolean,
        default: false
    },

    token: {
        type: String,
        default: null
    },

    tokenExpires: {
        type: Date,
        default: null
    },

    passwordChangedAt: {
        type: Date,
        default: null
    },

    // ⭐️⭐️⭐️ ADDED FIELDS FROM models.js ⭐️⭐️⭐️

    role: {
        type: String,
        enum: ["patient", "doctor", "hospital", "pharmacy", "admin"],
        default: "patient"
    },

    abhaId: {
        type: String,
        default: null
    },

    biometricToken: {
        type: String,
        default: null
    },

    // Security fields
    accountHash: {
        type: String,
        default: null,
        select: false
    }

}, {
    timestamps: true
});

//? Hash password before saving with bcrypt + SHA-256
userScheme.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        // Create SHA-256 hash of the password for additional security layer
        this.passwordHash = createHash(this.password);
        
        // Hash password with bcrypt
        this.password = await bcrypt.hash(this.password, +process.env.SALTROUNDS);
        this.passwordChangedAt = Date.now();
        
        // Create account integrity hash
        const accountData = `${this.email}:${this.username}:${this.role}`;
        this.accountHash = createHash(accountData);
    } catch (error) {
        console.error('Password hashing error:', error);
        return next(error);
    }
    
    next();
});

//? Encrypt sensitive tokens before saving
userScheme.pre("save", function (next) {
    if (this.biometricToken && !this.biometricToken.includes(':')) {
        try {
            this.biometricToken = encrypt(this.biometricToken);
        } catch (error) {
            console.error('Token encryption error:', error);
        }
    }
    next();
});

//? Compare password method with SHA-256 verification
userScheme.methods.comparePassword = async function (userPassword) {
    try {
        // First verify SHA-256 hash if it exists
        if (this.passwordHash) {
            const inputHash = createHash(userPassword);
            if (inputHash !== this.passwordHash) {
                return false;
            }
        }
        
        // Then verify bcrypt hash
        return await bcrypt.compare(userPassword, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

//? Verify account integrity
userScheme.methods.verifyAccountIntegrity = function () {
    if (!this.accountHash) return true; // Skip if not set
    
    const accountData = `${this.email}:${this.username}:${this.role}`;
    const currentHash = createHash(accountData);
    
    return currentHash === this.accountHash;
};

//? Decrypt sensitive tokens
userScheme.methods.decryptBiometricToken = function () {
    if (this.biometricToken && this.biometricToken.includes(':')) {
        try {
            return decrypt(this.biometricToken);
        } catch (error) {
            console.error('Token decryption error:', error);
            return null;
        }
    }
    return this.biometricToken;
};

const userModel = mongoose.model("User", userScheme);

export default userModel;