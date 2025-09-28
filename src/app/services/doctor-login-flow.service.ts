import { Injectable } from '@angular/core';

/**
 * 医生登录过程中涉及的科室基础类型定义，确保下游模块严格受控。
 */
export interface DoctorDepartmentOption {
  /** 唯一值，通常对应 HIS 系统内的科室编码。 */
  value: string;
  /** 中文名称，直接呈现在界面上。 */
  label: string;
}

/**
 * 医生登录过程中涉及的院区选项，包含院区下属科室。
 */
export interface DoctorCampusOption {
  value: string;
  label: string;
  departments: DoctorDepartmentOption[];
}

/**
 * 医生系统选项，内含院区层级，便于一次性获取权限树。
 */
export interface DoctorSystemOption {
  value: string;
  label: string;
  description: string;
  campuses: DoctorCampusOption[];
}

/**
 * 医生账号权限配置，模拟来自后端的鉴权结果。
 */
export interface DoctorPermissionProfile {
  username: string;
  /** 姓名用于问候语展示。 */
  displayName: string;
  /** 演示环境中的明文密码，真实环境需改为密文。 */
  password: string;
  systems: DoctorSystemOption[];
}

interface DoctorSessionState {
  profile: DoctorPermissionProfile;
  rememberMe: boolean;
}

@Injectable({ providedIn: 'root' })
export class DoctorLoginFlowService {
  /**
   * 内部权限表，后续可替换为 API 调用或数据字典服务。
   */
  private readonly permissionProfiles: DoctorPermissionProfile[] = [
    {
      username: 'zhangsan',
      displayName: '张三',
      password: 'doctor123',
      systems: [
        {
          value: 'outpatient',
          label: '门诊医生站',
          description: '覆盖门诊排班、叫号与病历录入能力。',
          campuses: [
            {
              value: 'main',
              label: '本部院区',
              departments: [
                { value: 'cardiology', label: '心内科' },
                { value: 'respiratory', label: '呼吸与危重症医学科' },
                { value: 'emergency', label: '急诊科' }
              ]
            },
            {
              value: 'east',
              label: '东城院区',
              departments: [
                { value: 'surgery', label: '普外科' },
                { value: 'orthopedics', label: '骨科' }
              ]
            }
          ]
        },
        {
          value: 'inpatient',
          label: '住院医生站',
          description: '聚焦住院病程管理与医嘱执行追踪。',
          campuses: [
            {
              value: 'main',
              label: '本部院区',
              departments: [
                { value: 'nephrology', label: '肾内科' },
                { value: 'endocrinology', label: '内分泌科' }
              ]
            }
          ]
        }
      ]
    },
    {
      username: 'lisi',
      displayName: '李四',
      password: 'secure456',
      systems: [
        {
          value: 'outpatient',
          label: '门诊医生站',
          description: '提供门诊业务相关功能入口。',
          campuses: [
            {
              value: 'south',
              label: '南湖院区',
              departments: [
                { value: 'pediatrics', label: '儿科' },
                { value: 'obstetrics', label: '产科' }
              ]
            }
          ]
        }
      ]
    }
  ];

  /** 当前登录流程状态，仅在两步登录过程中保留。 */
  private activeSession: DoctorSessionState | null = null;

  /**
   * 校验账号密码是否匹配，匹配后缓存对应权限树。
   */
  authenticate(username: string, password: string, rememberMe: boolean): DoctorPermissionProfile | null {
    const trimmedUsername = username.trim();
    const profile = this.permissionProfiles.find(
      (item) => item.username === trimmedUsername && item.password === password
    );

    if (!profile) {
      this.activeSession = null;
      return null;
    }

    this.activeSession = { profile, rememberMe };
    return profile;
  }

  /** 获取当前登录流程中的权限信息，若为空则需重新登录。 */
  getActiveProfile(): DoctorPermissionProfile | null {
    return this.activeSession?.profile ?? null;
  }

  /**
   * 记住密码开关状态，便于第二步根据用户偏好提供提示。
   */
  getRememberMe(): boolean {
    return this.activeSession?.rememberMe ?? false;
  }

  /**
   * 完成登录流程或异常时，需清理缓存状态以防权限泄露。
   */
  clearSession(): void {
    this.activeSession = null;
  }
}
