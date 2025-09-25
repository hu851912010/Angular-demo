import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface PatientDetail {
  id: string;
  name: string;
  gender: '男' | '女';
  age: number;
  dept: string;
  doctor: string;
  visitTime: string;
  status: string;
  allergies: string;
  notes: string;
  tags: string[];
}

interface ConsultationFeature {
  id: FeatureKey;
  title: string;
  icon: string;
  description: string;
}

type FeatureKey = 'diagnosis' | 'orders' | 'records' | 'certificate' | 'consent';

type ActionKey = 'followup' | 'referral' | 'finish' | 'history' | 'print';

interface ConsultationAction {
  id: ActionKey;
  title: string;
  icon: string;
  description: string;
  highlights: string[];
  primaryText: string;
}

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatTabsModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './consultation.html',
  styleUrls: ['./consultation.scss']
})
export class ConsultationComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild('actionDialog') actionDialogTpl?: TemplateRef<ConsultationAction>;

  private dialogRef: MatDialogRef<unknown> | null = null;

  private readonly featureList: ConsultationFeature[] = [
    {
      id: 'diagnosis',
      title: '诊断',
      icon: 'medical_information',
      description: '记录主诉与诊断结论'
    },
      {
      id: 'records',
      title: '病历',
      icon: 'description',
      description: '查看及补充病历信息'
    },
    
    {
      id: 'orders',
      title: '医嘱',
      icon: 'medication',
      description: '开立处方与医技检查'
    },
 
    {
      id: 'certificate',
      title: '疾病证明',
      icon: 'verified',
      description: '开具诊断证明或休假单'
    },
    {
      id: 'consent',
      title: '知情同意书',
      icon: 'assignment_turned_in',
      description: '签署及打印知情告知书'
    }
  ];

  readonly consultationActions: ConsultationAction[] = [
    {
      id: 'followup',
      title: '复诊预约',
      icon: 'event_available',
      description: '为患者安排下次复诊时间并同步至患者端提醒。',
      highlights: ['智能推荐复诊时间段', '自动生成预约凭证并推送'],
      primaryText: '确认预约'
    },
    {
      id: 'referral',
      title: '转诊',
      icon: 'sync_alt',
      description: '选择目标科室或上级医院，完成一键转诊申请。',
      highlights: ['查看多学科会诊建议', '上传补充资料与影像'],
      primaryText: '提交转诊'
    },
    {
      id: 'finish',
      title: '结束看诊',
      icon: 'check_circle',
      description: '核对医嘱与病历信息，确认结束本次看诊。',
      highlights: ['确认医嘱与处方已同步', '自动推送随访计划至患者'],
      primaryText: '结束看诊'
    },
    {
      id: 'history',
      title: '就诊记录',
      icon: 'history',
      description: '快速回顾患者历次就诊、检验与影像资料。',
      highlights: ['时间轴查看历次诊疗', '一键比对关键检查指标'],
      primaryText: '打开记录'
    },
    {
      id: 'print',
      title: '集中打印',
      icon: 'print',
      description: '选择需要打印的病历、处方和知情同意书，实现一键打印。',
      highlights: ['支持批量生成PDF', '自动带入电子签名与盖章'],
      primaryText: '生成打印包'
    }
  ];

  patient: PatientDetail | null = null;
  openTabs: ConsultationFeature[] = [];
  activeTabIndex = 0;

  constructor() {
    const patientId = this.route.snapshot.paramMap.get('id') ?? '';
    this.patient = this.loadPatient(patientId);
    const defaultFeature = this.featureList[0];
    this.openTabs = [defaultFeature];
    this.activeTabIndex = 0;
  }

  get features(): ConsultationFeature[] {
    return this.featureList;
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }

  openAction(action: ConsultationAction): void {
    if (!this.actionDialogTpl) {
      return;
    }

    this.dialogRef = this.dialog.open(this.actionDialogTpl, {
      data: action,
      width: '520px',
      panelClass: 'consultation-action-dialog'
    });
  }

  triggerAction(action: ConsultationAction): void {
    this.snackBar.open(`${action.title}操作已记录，系统将继续处理。`, undefined, {
      duration: 2600
    });
    this.dialogRef?.close();
  }

  openFeature(feature: ConsultationFeature): void {
    const existingIndex = this.openTabs.findIndex((tab) => tab.id === feature.id);
    if (existingIndex === -1) {
      this.openTabs = [...this.openTabs, feature];
      this.activeTabIndex = this.openTabs.length - 1;
    } else {
      this.activeTabIndex = existingIndex;
    }
  }

  isFeatureActive(feature: ConsultationFeature): boolean {
    return this.openTabs[this.activeTabIndex]?.id === feature.id;
  }

  closeTab(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.openTabs.length === 1) {
      return;
    }
    const wasActive = index === this.activeTabIndex;
    const newTabs = this.openTabs.filter((_, i) => i !== index);
    this.openTabs = newTabs;
    if (wasActive) {
      this.activeTabIndex = Math.min(index, newTabs.length - 1);
    } else if (index < this.activeTabIndex) {
      this.activeTabIndex -= 1;
    }
  }

  getTabDescription(id: FeatureKey): string {
    return this.featureList.find((feature) => feature.id === id)?.description ?? '';
  }

  private loadPatient(id: string): PatientDetail {
    const mockPatients: Record<string, PatientDetail> = {
      P20241001: {
        id: 'P20241001',
        name: '张伟',
        gender: '男',
        age: 42,
        dept: '心内科',
        doctor: '李主任',
        visitTime: '2024-10-10 09:20',
        status: '候诊',
        allergies: '青霉素',
        notes: '血压波动较大，请重点关注。\n既往史：高血压10年，糖尿病3年。',
        tags: ['高血压', '糖尿病', '随访']
      },
      P20241002: {
        id: 'P20241002',
        name: '王芳',
        gender: '女',
        age: 35,
        dept: '呼吸内科',
        doctor: '周医生',
        visitTime: '2024-10-10 10:05',
        status: '就诊中',
        allergies: '无',
        notes: '近期夜间咳嗽明显，需评估是否哮喘急性发作。',
        tags: ['哮喘']
      }
    };

    return (
      mockPatients[id] ?? {
        id,
        name: '临时患者',
        gender: '男',
        age: 30,
        dept: '全科门诊',
        doctor: '值班医生',
        visitTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: '候诊',
        allergies: '未记录',
        notes: '暂无详细病史，请补充。',
        tags: ['新建档案']
      }
    );
  }
}
