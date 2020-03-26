import {fetch, post, } from '../utils/http';
import {IUser, ILogin, IRegister,} from './model';

export const getProfile = () => fetch<IUser>('auth/user');

export const login = (param: ILogin) => post<IUser>('auth/login', param);

export const authLogin = (param: any) => post<IUser>('auth/oauth/mini', param);

export const logout = () => fetch('auth/logout');

export const register = (param: IRegister) => post<IUser>('auth/register', param);