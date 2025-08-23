import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherVariable } from '@shared/models/weather';

@Component({
  selector: 'app-weather-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-controls.component.html',
  styleUrls: ['./weather-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherControlsComponent {
  @Input({ required: true }) variable!: WeatherVariable;
  @Input({ required: true }) heatRadius!: number;
  @Input({ required: true }) heatOpacity!: number;
  @Input() loading = false;
  @Input() lastUpdated: Date | null = null;
  @Input() error: string | null = null;
  @Input() showLabels = true;
  @Input() showBasemapLabels = false;

  @Output() showLabelsChange = new EventEmitter<boolean>();
  @Output() showBasemapLabelsChange = new EventEmitter<boolean>();
  @Output() variableChange = new EventEmitter<WeatherVariable>();
  @Output() heatRadiusChange = new EventEmitter<number>();
  @Output() heatOpacityChange = new EventEmitter<number>();

  @Output() refresh = new EventEmitter<void>();

  setVar(v: WeatherVariable) {
    this.variableChange.emit(v);
  }
}
