export interface Login {
    email : string;
    password : string;
}
export interface LoginResponse {
    token : string;
    fullName : string;
    email : string;
    role : string;
}
export interface UserCreate {
    email : string;
    password : string;
    name : string;
    lastName : string;
    departmentId : string;
}
export interface UserResponse {
    fullName : string;
    email : string;
    roleName? : string | null;
    teamName? : string | null;
    isActive : string;
}