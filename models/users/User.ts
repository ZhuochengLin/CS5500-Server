import AccountType from "./AccountType";
import MaritalStatus from "./MaritalStatus";
import Location from "./Location";

export default interface User {
    _id: string,
    username: string,
    password: string,
    email: string,
    joined: Date,
    firstName?: string,
    lastName?: string,
    profilePhoto?: string,
    headerImage?: string,
    bio?: string,
    dateOfBirth?: Date,
    accountType?: AccountType,
    maritalStatus?: MaritalStatus,
    location?: Location
};